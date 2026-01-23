/**
 * Client MusicBrainz API
 * Documentation: https://musicbrainz.org/doc/MusicBrainz_API
 */

import { config } from '../../config/settings';

// Types MusicBrainz
export interface MBReleaseGroup {
  id: string;
  title: string;
  'primary-type'?: string;
  'secondary-types'?: string[];
  'first-release-date'?: string;
  'artist-credit'?: MBArtistCredit[];
}

export interface MBRelease {
  id: string;
  title: string;
  status?: string;
  date?: string;
  country?: string;
  'release-events'?: MBReleaseEvent[];
  'label-info'?: MBLabelInfo[];
  media?: MBMedia[];
  'artist-credit'?: MBArtistCredit[];
  'release-group'?: MBReleaseGroup;
  barcode?: string;
}

export interface MBReleaseEvent {
  date?: string;
  area?: { name: string; 'iso-3166-1-codes'?: string[] };
}

export interface MBLabelInfo {
  'catalog-number'?: string;
  label?: { id: string; name: string };
}

export interface MBMedia {
  format?: string;
  'track-count'?: number;
  position?: number;
}

export interface MBArtistCredit {
  name?: string;
  artist: { id: string; name: string };
  joinphrase?: string;
}

export interface MBSearchResult<T> {
  count: number;
  offset: number;
  releases?: T[];
  'release-groups'?: T[];
}

// Rate limiter
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < config.musicBrainz.rateLimitMs) {
    await sleep(config.musicBrainz.rateLimitMs - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': config.musicBrainz.userAgent,
      Accept: 'application/json',
    },
  });

  if (response.status === 503) {
    // Rate limited, attendre et réessayer
    console.log('⏳ MusicBrainz rate limit, waiting 2s...');
    await sleep(2000);
    return rateLimitedFetch(url);
  }

  return response;
}

/**
 * Effectue une requête à l'API MusicBrainz
 */
async function mbFetch<T>(endpoint: string): Promise<T> {
  const url = `${config.musicBrainz.apiBaseUrl}${endpoint}`;
  const response = await rateLimitedFetch(url);

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status} - ${await response.text()}`);
  }

  return response.json();
}

/**
 * Recherche des releases (pressages) par UPC/barcode
 */
export async function searchReleasesByBarcode(barcode: string): Promise<MBRelease[]> {
  const result = await mbFetch<MBSearchResult<MBRelease>>(
    `/release?query=barcode:${barcode}&fmt=json`
  );
  return result.releases || [];
}

/**
 * Recherche des releases par artiste + titre d'album
 */
export async function searchReleases(
  artist: string,
  album: string,
  options: { country?: string; format?: string } = {}
): Promise<MBRelease[]> {
  const artistEncoded = encodeURIComponent(artist);
  const albumEncoded = encodeURIComponent(album);

  let query = `artist:"${artistEncoded}" AND release:"${albumEncoded}"`;

  if (options.country) {
    query += ` AND country:${options.country}`;
  }

  if (options.format) {
    query += ` AND format:"${options.format}"`;
  }

  const result = await mbFetch<MBSearchResult<MBRelease>>(
    `/release?query=${encodeURIComponent(query)}&fmt=json&limit=100`
  );

  return result.releases || [];
}

/**
 * Recherche des Release Groups (équivalent d'un Album abstrait)
 */
export async function searchReleaseGroups(
  artist: string,
  album: string
): Promise<MBReleaseGroup[]> {
  const artistEncoded = encodeURIComponent(artist);
  const albumEncoded = encodeURIComponent(album);

  const query = `artist:"${artistEncoded}" AND releasegroup:"${albumEncoded}"`;

  const result = await mbFetch<MBSearchResult<MBReleaseGroup>>(
    `/release-group?query=${encodeURIComponent(query)}&fmt=json&limit=20`
  );

  return result['release-groups'] || [];
}

/**
 * Récupère toutes les releases d'un Release Group
 */
export async function getReleaseGroupReleases(
  releaseGroupId: string,
  options: { country?: string } = {}
): Promise<MBRelease[]> {
  let url = `/release?release-group=${releaseGroupId}&fmt=json&limit=100&inc=labels+media+release-groups`;

  const response = await mbFetch<MBSearchResult<MBRelease>>(url);
  let releases = response.releases || [];

  // Filtrer par pays si spécifié
  if (options.country) {
    releases = releases.filter((r) => r.country === options.country);
  }

  return releases;
}

/**
 * Récupère les détails complets d'une release
 */
export async function getReleaseDetails(releaseId: string): Promise<MBRelease> {
  return mbFetch<MBRelease>(
    `/release/${releaseId}?fmt=json&inc=labels+media+artist-credits+release-groups`
  );
}

/**
 * Filtre les releases pour ne garder que les vinyles
 */
export function filterVinylReleases(releases: MBRelease[]): MBRelease[] {
  return releases.filter((release) => {
    if (!release.media) return false;
    return release.media.some((m) =>
      config.import.vinylFormats.some((format) =>
        m.format?.toLowerCase().includes(format.toLowerCase().replace(/"/g, ''))
      )
    );
  });
}

/**
 * Extrait l'artiste principal d'un artist-credit
 */
export function extractArtist(credits?: MBArtistCredit[]): string {
  if (!credits?.length) return 'Unknown Artist';
  return credits.map((c) => c.name || c.artist.name).join('');
}

/**
 * Extrait le format complet des media
 */
export function extractFormat(media?: MBMedia[]): string | undefined {
  if (!media?.length) return undefined;
  const formats = media.map((m) => m.format).filter(Boolean);
  if (formats.length === 0) return undefined;
  if (formats.length === 1) return formats[0];
  // Si plusieurs médias, formatter comme "2xLP"
  const formatCounts: Record<string, number> = {};
  formats.forEach((f) => {
    formatCounts[f!] = (formatCounts[f!] || 0) + 1;
  });
  return Object.entries(formatCounts)
    .map(([format, count]) => (count > 1 ? `${count}x${format}` : format))
    .join(' + ');
}

/**
 * Extrait le label et catalog number
 */
export function extractLabelInfo(labelInfo?: MBLabelInfo[]): {
  label?: string;
  catalogNumber?: string;
} {
  if (!labelInfo?.length) return {};
  const first = labelInfo[0];
  return {
    label: first.label?.name,
    catalogNumber: first['catalog-number'],
  };
}

/**
 * Extrait l'année d'une date
 */
export function extractYear(date?: string): number | undefined {
  if (!date) return undefined;
  const year = parseInt(date.split('-')[0], 10);
  return isNaN(year) ? undefined : year;
}

/**
 * Convertit une release MusicBrainz en format Vinyl pour la BDD
 */
export function mbReleaseToDbVinyl(release: MBRelease, albumId: string) {
  const { label, catalogNumber } = extractLabelInfo(release['label-info']);

  return {
    album_id: albumId,
    musicbrainz_release_id: release.id,
    title: release.title,
    artist: extractArtist(release['artist-credit']),
    year: extractYear(release.date),
    label,
    catalog_number: catalogNumber,
    country: release.country,
    format: extractFormat(release.media),
  };
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
