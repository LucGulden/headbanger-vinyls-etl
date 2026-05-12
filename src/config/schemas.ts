/**
 * Zod schemas for the JSONL files produced between parts.
 *
 * Each schema documents:
 *   - the contract a part must respect on output
 *   - the contract the next part can rely on as input
 *
 * Every line read from a JSONL file is re-validated through these
 * schemas. This is also a security gate: external data (Discogs,
 * MusicBrainz) is treated as untrusted; if a field doesn't match the
 * schema, the line is rejected before it can reach the DB.
 */
import { z } from 'zod';

// ============================================================
// Shared atoms
// ============================================================

const IsoYear = z.number().int().min(1900).max(2100);
const IsoCountryCode = z.string().regex(/^[A-Z]{2}$/);
const CoverSource = z.enum([
  'discogs',
  'musicbrainz',
  'cover_art_archive',
  'spotify',
]);

// ============================================================
// Stage 01 — Discogs extract (Part 2 output)
// ============================================================
// One line per Discogs release that passes the scope filters.
// Carries enough album- and pressing-level data to feed Part 4.

export const Stage01DiscogsReleaseSchema = z.object({
  source: z.literal('discogs'),
  discogsReleaseId: z.string(), // master_id when applicable
  discogsMasterId: z.string().nullable(),

  // --- album-level info (used to build/match the album entity) ---
  title: z.string(),
  artists: z
    .array(
      z.object({
        discogsArtistId: z.string(),
        name: z.string(),
        role: z.string().nullable(), // "primary", "feat.", etc.
      }),
    )
    .min(1),

  // --- pressing-level (vinyl) info ---
  releaseYear: IsoYear.nullable(),
  country: IsoCountryCode.nullable(),
  labels: z.array(
    z.object({
      discogsLabelId: z.string(),
      name: z.string(),
      catalogNumber: z.string().nullable(),
    }),
  ),
  formats: z.array(z.string()), // raw Discogs format strings
  format: z.string().nullable(), // our normalised value: LP / EP / 7" / 10" / 12" / Picture Disc
  isReissue: z.boolean(),
  isRemastered: z.boolean(),
  weightGrams: z.number().int().positive().nullable(),
  color: z.string().nullable(),
  matrixRunout: z.string().nullable(),
  barcode: z.string().nullable(),

  // --- tracklist on this specific pressing ---
  tracks: z.array(
    z.object({
      side: z.string().regex(/^[A-Z]$/),
      position: z.number().int().positive(),
      title: z.string(),
      durationSeconds: z.number().int().positive().nullable(),
    }),
  ),

  // --- free text (sanitised in Part 8 before reaching DB) ---
  notes: z.string().nullable(),
  credits: z.string().nullable(),

  // --- genre + style (Discogs uses both; we keep both raw here) ---
  genres: z.array(z.string()),
  styles: z.array(z.string()),

  // --- cross-references found in Discogs URL fields ---
  musicbrainzReleaseId: z.string().uuid().nullable(),
  musicbrainzReleaseGroupId: z.string().uuid().nullable(),
});
export type Stage01DiscogsRelease = z.infer<typeof Stage01DiscogsReleaseSchema>;

// ============================================================
// Stage 02 — MusicBrainz extract (Part 3 output)
// ============================================================
// JSONL stream mixing three kinds of records (artist, release_group,
// release). Discriminated by `kind`.

export const Stage02MusicBrainzArtistSchema = z.object({
  source: z.literal('musicbrainz'),
  kind: z.literal('artist'),
  musicbrainzId: z.string().uuid(),
  name: z.string(),
  sortName: z.string().nullable(),
  type: z.string().nullable(), // Person / Group / Orchestra / ...
  country: z.string().nullable(), // ISO code
  area: z.string().nullable(), // free text (e.g., "Paris")
  beginDate: z.string().nullable(), // ISO partial date (YYYY, YYYY-MM, YYYY-MM-DD)
  endDate: z.string().nullable(),
  disambiguation: z.string().nullable(),
  discogsArtistId: z.string().nullable(), // resolved from URL relationships
});
export type Stage02MusicBrainzArtist = z.infer<
  typeof Stage02MusicBrainzArtistSchema
>;

export const Stage02MusicBrainzReleaseGroupSchema = z.object({
  source: z.literal('musicbrainz'),
  kind: z.literal('release_group'),
  musicbrainzId: z.string().uuid(),
  title: z.string(),
  primaryType: z.string().nullable(), // Album / EP / Single / ...
  firstReleaseDate: z.string().nullable(),
  artistCredits: z
    .array(
      z.object({
        musicbrainzArtistId: z.string().uuid(),
        name: z.string(),
        joinPhrase: z.string().nullable(),
      }),
    )
    .min(1),
  discogsMasterId: z.string().nullable(),
});
export type Stage02MusicBrainzReleaseGroup = z.infer<
  typeof Stage02MusicBrainzReleaseGroupSchema
>;

export const Stage02MusicBrainzReleaseSchema = z.object({
  source: z.literal('musicbrainz'),
  kind: z.literal('release'),
  musicbrainzId: z.string().uuid(),
  releaseGroupMbid: z.string().uuid(),
  title: z.string(),
  country: IsoCountryCode.nullable(),
  date: z.string().nullable(),
  barcode: z.string().nullable(),
  labels: z.array(
    z.object({
      musicbrainzLabelId: z.string().uuid(),
      name: z.string(),
      catalogNumber: z.string().nullable(),
    }),
  ),
  mediaFormats: z.array(z.string()), // "12\" Vinyl", "7\" Vinyl", "CD", ...
  discogsReleaseId: z.string().nullable(),
});
export type Stage02MusicBrainzRelease = z.infer<
  typeof Stage02MusicBrainzReleaseSchema
>;

export const Stage02MusicBrainzRecordSchema = z.discriminatedUnion('kind', [
  Stage02MusicBrainzArtistSchema,
  Stage02MusicBrainzReleaseGroupSchema,
  Stage02MusicBrainzReleaseSchema,
]);
export type Stage02MusicBrainzRecord = z.infer<
  typeof Stage02MusicBrainzRecordSchema
>;

// ============================================================
// Stage 03 — Resolved + merged entities (Part 4 output)
// ============================================================
// One line per final entity, deduplicated across Discogs and MB.
// No covers yet, no Spotify enrichment yet.
//
// Each entity has a `pipelineKey` — a stable string identifier used to
// FK between entities BEFORE Supabase has assigned real UUIDs. Part 7
// resolves these to real UUIDs at insert time.

export const Stage03ArtistSchema = z.object({
  kind: z.literal('artist'),
  pipelineKey: z.string(), // e.g. "artist:mb:f27ec8db-..."
  name: z.string(),
  musicbrainzId: z.string().uuid().nullable(),
  discogsArtistId: z.string().nullable(),
  spotifyId: z.string().nullable(), // filled by Part 6
  country: z.string().nullable(),
  origin: z.string().nullable(),
  foundedDate: z.string().nullable(),
  activeYearsStart: z.number().int().nullable(),
  activeYearsEnd: z.number().int().nullable(),
  genres: z.array(z.string()),
});
export type Stage03Artist = z.infer<typeof Stage03ArtistSchema>;

export const Stage03AlbumSchema = z.object({
  kind: z.literal('album'),
  pipelineKey: z.string(),
  title: z.string(),
  primaryArtistPipelineKey: z.string(), // references a Stage03Artist
  additionalArtistPipelineKeys: z.array(z.string()),
  releaseYear: IsoYear.nullable(),
  musicbrainzReleaseGroupId: z.string().uuid().nullable(),
  discogsMasterId: z.string().nullable(),
  spotifyId: z.string().nullable(),
  genres: z.array(z.string()),
  // canonical tracklist (from MusicBrainz if available, else Discogs)
  tracks: z.array(
    z.object({
      position: z.number().int().positive(),
      title: z.string(),
      durationSeconds: z.number().int().positive().nullable(),
    }),
  ),
});
export type Stage03Album = z.infer<typeof Stage03AlbumSchema>;

export const Stage03VinylSchema = z.object({
  kind: z.literal('vinyl'),
  pipelineKey: z.string(),
  albumPipelineKey: z.string(),
  musicbrainzReleaseId: z.string().uuid().nullable(),
  discogsReleaseId: z.string(), // always present — vinyls come from Discogs
  catalogNumber: z.string().nullable(),
  countryCode: IsoCountryCode.nullable(),
  releaseYear: IsoYear.nullable(),
  label: z.string().nullable(),
  format: z.string().nullable(),
  isReissue: z.boolean(),
  isRemastered: z.boolean(),
  weightGrams: z.number().int().positive().nullable(),
  color: z.string().nullable(),
  matrixRunout: z.string().nullable(),
  barcode: z.string().nullable(),
  includes: z.string().nullable(),
  credits: z.string().nullable(),
  // tracklist specific to this pressing (per-side ordering)
  tracks: z.array(
    z.object({
      side: z.string().regex(/^[A-Z]$/),
      position: z.number().int().positive(),
      title: z.string(),
    }),
  ),
});
export type Stage03Vinyl = z.infer<typeof Stage03VinylSchema>;

export const Stage03RecordSchema = z.discriminatedUnion('kind', [
  Stage03ArtistSchema,
  Stage03AlbumSchema,
  Stage03VinylSchema,
]);
export type Stage03Record = z.infer<typeof Stage03RecordSchema>;

// ============================================================
// Stage 04 — Cover URLs resolved (Part 5 output)
// ============================================================
// Same as Stage 03, plus cover_url + cover_source per entity.

const CoverInfo = z.object({
  coverUrl: z.string().url().nullable(),
  coverSource: CoverSource.nullable(),
});

export const Stage04ArtistSchema = Stage03ArtistSchema.extend({
  kind: z.literal('artist'),
  avatarUrl: z.string().url().nullable(),
  cover: CoverInfo,
});
export type Stage04Artist = z.infer<typeof Stage04ArtistSchema>;

export const Stage04AlbumSchema = Stage03AlbumSchema.extend({
  kind: z.literal('album'),
  cover: CoverInfo,
});
export type Stage04Album = z.infer<typeof Stage04AlbumSchema>;

export const Stage04VinylSchema = Stage03VinylSchema.extend({
  kind: z.literal('vinyl'),
  cover: CoverInfo,
});
export type Stage04Vinyl = z.infer<typeof Stage04VinylSchema>;

export const Stage04RecordSchema = z.discriminatedUnion('kind', [
  Stage04ArtistSchema,
  Stage04AlbumSchema,
  Stage04VinylSchema,
]);
export type Stage04Record = z.infer<typeof Stage04RecordSchema>;

// ============================================================
// Stage 05 — Spotify-enriched (Part 6 output)
// ============================================================
// Same shape as Stage 04. Only `spotifyId` / `cover` fields may have
// gained values. Schema reused verbatim.

export const Stage05RecordSchema = Stage04RecordSchema;
export type Stage05Record = z.infer<typeof Stage05RecordSchema>;