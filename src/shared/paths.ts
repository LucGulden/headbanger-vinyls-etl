/**
 * Canonical filesystem paths and file names used across the pipeline.
 * Single source of truth — every part imports from here so we never
 * hard-code a filename twice.
 */
import { join } from 'node:path';
import { config } from '../config/index.js';

export const rawPath = (filename: string): string =>
  join(config.paths.raw, filename);

export const stagePath = (filename: string): string =>
  join(config.paths.stage, filename);

export const finalPath = (filename: string): string =>
  join(config.paths.final, filename);

/**
 * Canonical names of inter-part artefacts.
 * The number prefix matches the part that produces the file.
 */
export const PIPELINE_FILES = {
  stage01DiscogsReleases: 'stage-01-discogs-releases.jsonl',
  stage02MusicBrainz: 'stage-02-musicbrainz.jsonl',
  stage03Resolved: 'stage-03-resolved.jsonl',
  stage04Covered: 'stage-04-covered.jsonl',
  stage05SpotifyEnriched: 'stage-05-spotify-enriched.jsonl',
} as const;

/**
 * Canonical names of the raw dump files we expect under data/raw/.
 * Discogs publishes monthly dumps named with a YYYYMM stamp; we keep
 * placeholders here and resolve the actual paths in each part.
 */
export const RAW_DUMPS = {
  discogsArtistsGlob: 'discogs_*_artists.xml.gz',
  discogsLabelsGlob: 'discogs_*_labels.xml.gz',
  discogsMastersGlob: 'discogs_*_masters.xml.gz',
  discogsReleasesGlob: 'discogs_*_releases.xml.gz',
  musicbrainzDumpGlob: 'mbdump-*.tar.bz2',
} as const;