# headbanger-etl

Standalone ETL pipeline that seeds the HeadBanger Supabase catalogue
(artists, albums, vinyls, tracks) from public open-data dumps (Discogs,
MusicBrainz, Cover Art Archive) and the Spotify API.

**This project is intentionally separate from the HeadBanger application
repository.** The data pipeline has a different lifecycle (runs monthly
or on-demand, not at every deploy), different dependencies, different
secrets (Supabase service role key, which must NEVER reach the app),
and different operators. Keeping it apart enforces those boundaries.

The pipeline is offline-first: dumps are downloaded, parsed, filtered
and merged on disk into a chain of JSONL files. The DB only sees data
at the very last stage. No part of the running HeadBanger app depends
on these external sources at runtime.

## Architecture

Each part of the pipeline is an independent script that reads one or
more `stage-XX-*.jsonl` files and writes the next one. Any part can be
re-run in isolation — re-running the cover-fetching part doesn't force
a re-parse of the 8 GB Discogs dump.

```
data/
├── raw/         # downloaded dumps (Discogs, MusicBrainz, …)
├── stage/       # JSONL artefacts between parts
├── checkpoints/ # per-part resumption state
└── final/       # SQL batches loaded into Supabase
```

## Parts

| Part | What it does                                          | Input                          | Output                            |
| ---- | ----------------------------------------------------- | ------------------------------ | --------------------------------- |
| 1    | Config, schemas, helpers (this scaffolding)           | —                              | —                                 |
| 2    | Filter Discogs dump → in-scope vinyl releases         | `raw/discogs_*.xml.gz`         | `stage-01-discogs-releases.jsonl` |
| 3    | Filter MusicBrainz dump → in-scope artists / works    | `raw/mbdump-*.tar.bz2`         | `stage-02-musicbrainz.jsonl`      |
| 4    | Resolve cross-refs + merge Discogs ↔ MusicBrainz      | stage 01 + 02                  | `stage-03-resolved.jsonl`         |
| 5    | Resolve cover URLs (Cover Art Archive, Discogs API)   | stage 03                       | `stage-04-covered.jsonl`          |
| 6    | Spotify enrichment (top-N internationally popular)    | stage 04                       | `stage-05-spotify-enriched.jsonl` |
| 7    | Load into Supabase                                    | stage 05                       | DB rows                           |
| 8    | Recurring updates (weekly cron, live APIs)            | —                              | DB rows                           |

## Setup

```bash
# clone this repo somewhere outside the HeadBanger app repo
git clone <this-repo> headbanger-etl
cd headbanger-etl

pnpm install
cp .env.example .env   # then fill the credentials
```

### Pre-flight: apply the SQL migration on the HeadBanger DB

Before Part 7 can run, the `cover_source` CHECK constraints on
`album`, `artist` and `vinyl` need to be widened to accept `discogs`
and `cover_art_archive`.

1. Open Supabase → SQL Editor.
2. Paste the content of `migrations/003-extend-cover-source.sql`.
3. Run it. The output panel should show the three new CHECK clauses.

This migration is kept in this repo (not the app repo) because it's a
pre-requisite for the ETL, not for the application. Apply it once
manually.

### Pre-flight: wipe the DB

Run the wipe script (provided separately) in the SQL Editor before the
first end-to-end run.

## Running

```bash
pnpm part-02
pnpm part-03
pnpm part-04
pnpm part-05
pnpm part-06
pnpm part-07
```

Each part can be re-run independently if its inputs exist in
`data/stage/`. A crashed part can usually resume from its last
checkpoint (see `data/checkpoints/`).

## Scope

All filter criteria live in `src/config/scope.ts`. Edit there to widen
or narrow the import — no other file should hard-code scope decisions.

**MVP scope** (French-first):

- All MusicBrainz artists whose `country` is FR or French Overseas
  (RE, MQ, GP, GF, YT, NC, PF).
- Full discographies of priority French labels (see
  `FRENCH_PRIORITY_LABELS`).
- Top 500 internationally-popular artists by Spotify popularity
  (≥ 50/100).
- Vinyl pressings, ordered by pressing country: FR > BE > CH > UK >
  DE > IT > ES > NL > US.

**Phase 2** (later): widen `FRENCH_SCOPE_COUNTRY_CODES` to add the US,
raise `INTERNATIONAL_TOP_N_ARTISTS`, re-run.

## Security model

External data is treated as untrusted. Every JSONL line is
re-validated through its Zod schema on read — if a value doesn't match,
the line is rejected before it can reach the DB. Free-text fields
(bio, credits, notes, matrix runout, etc.) are HTML-stripped and
length-capped in Part 8 before insert.

The Supabase **service role key** is required by Part 7 to bypass RLS
for bulk inserts. It must never be committed and never reach the
frontend. Use `.env`, which is `.gitignore`d.

**This is also why this repo is separate from the app repo.** Mixing
the service role key with the application repo invites a leak: a
contributor reviewing app code shouldn't have visibility into pipeline
secrets, and CI/CD for the app shouldn't have access to the ETL
environment.

## Operating model

- Run the pipeline locally or on a dedicated machine — never from CI of
  the application.
- Schedule Part 8 (recurring updates) on a cron host (e.g., a small
  VPS, a GitHub Actions workflow scoped to this repo only, or a
  managed cron service).
- Logs and checkpoints stay on the machine running the pipeline; they
  are not shipped back to the app.