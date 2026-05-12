/**
 * Locate Discogs dump files under data/raw/.
 *
 * Discogs publishes 4 monthly files with date stamps in their names:
 *   discogs_YYYYMMDD_artists.xml.gz
 *   discogs_YYYYMMDD_labels.xml.gz
 *   discogs_YYYYMMDD_masters.xml.gz
 *   discogs_YYYYMMDD_releases.xml.gz
 *
 * We pick the most recent matching file for each kind. If multiple
 * months are present we always prefer the latest (lexicographic ordering
 * on the YYYYMMDD prefix works correctly).
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../../config/index.js';

export interface DiscogsDumpFiles {
  artists: string;
  labels: string;
  masters: string;
  releases: string;
  dumpDate: string; // YYYYMMDD
}

const PATTERNS = {
  artists: /^discogs_(\d{8})_artists\.xml\.gz$/,
  labels: /^discogs_(\d{8})_labels\.xml\.gz$/,
  masters: /^discogs_(\d{8})_masters\.xml\.gz$/,
  releases: /^discogs_(\d{8})_releases\.xml\.gz$/,
} as const;

export async function discoverDiscogsDumps(): Promise<DiscogsDumpFiles> {
  const dir = config.paths.raw;
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    throw new Error(
      `[discogs] cannot read raw dump directory ${dir}: ${(err as Error).message}\n` +
        `Download the Discogs monthly dumps from https://data.discogs.com/ ` +
        `and place them under ${dir}/`,
    );
  }

  const latest: Partial<Record<keyof typeof PATTERNS, { name: string; date: string }>> = {};

  for (const entry of entries) {
    for (const [kind, pattern] of Object.entries(PATTERNS) as Array<
      [keyof typeof PATTERNS, RegExp]
    >) {
      const m = pattern.exec(entry);
      if (!m) continue;
      const date = m[1]!;
      const prev = latest[kind];
      if (!prev || date > prev.date) {
        latest[kind] = { name: entry, date };
      }
    }
  }

  const missing: string[] = [];
  for (const kind of Object.keys(PATTERNS) as Array<keyof typeof PATTERNS>) {
    if (!latest[kind]) missing.push(`discogs_*_${kind}.xml.gz`);
  }
  if (missing.length > 0) {
    throw new Error(
      `[discogs] missing dump files in ${dir}: ${missing.join(', ')}\n` +
        `Download them from https://data.discogs.com/`,
    );
  }

  // Sanity: warn if dump dates disagree.
  const dates = new Set(Object.values(latest).map((v) => v!.date));
  if (dates.size > 1) {
    throw new Error(
      `[discogs] dump files have inconsistent dates: ${[...dates].join(', ')}\n` +
        `Mixing dumps from different months can produce cross-reference errors. ` +
        `Keep only one month under ${dir}/ or remove the older files.`,
    );
  }

  return {
    artists: join(dir, latest.artists!.name),
    labels: join(dir, latest.labels!.name),
    masters: join(dir, latest.masters!.name),
    releases: join(dir, latest.releases!.name),
    dumpDate: latest.releases!.date,
  };
}