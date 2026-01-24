/**
 * Client MusicBrainz API
 * Rate limit: 1 requête/seconde
 */

import { config } from '../../config/settings.js';
import type { VinylData } from './types.js';

// Rate limiting
let lastRequestTime = 0;
const MIN_DELAY = 1100;

async function mbFetch<T>(url: string): Promise<T> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY) await sleep(MIN_DELAY - elapsed);
  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': `FillCrate/2.0 (${config.musicbrainz.userAgent})`,
      Accept: 'application/json',
    },
  });

  if (response.status === 503 || response.status === 429) {
    await sleep(2000);
    return mbFetch(url);
  }

  if (!response.ok) throw new Error(`MusicBrainz error: ${response.status}`);
  return response.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalize(text: string): string {
  return text.replace(/['']/g, "'").replace(/[""]/g, '"').replace(/&/g, 'and').trim();
}

function isVinyl(format?: string): boolean {
  if (!format) return false;
  const f = format.toLowerCase();
  return f.includes('vinyl') || f.includes('12"') || f.includes('10"') || f.includes('7"') || f === 'lp';
}

// Types
interface MBReleaseGroup {
  id: string;
  title: string;
}

interface MBRelease {
  id: string;
  title: string;
  date?: string;
  country?: string;
  barcode?: string;
  media?: { format?: string }[];
  'label-info'?: { 'catalog-number'?: string; label?: { name: string } }[];
}

// Public API
export async function searchReleaseGroup(
  artist: string,
  title: string
): Promise<{ id: string; title: string } | null> {
  const query = encodeURIComponent(
    `artist:"${normalize(artist)}" AND releasegroup:"${normalize(title)}"`
  );

  try {
    const result = await mbFetch<{ 'release-groups': MBReleaseGroup[] }>(
      `https://musicbrainz.org/ws/2/release-group?query=${query}&limit=5&fmt=json`
    );

    if (!result['release-groups']?.length) return null;

    const normalized = title.toLowerCase().trim();
    const exact = result['release-groups'].find(
      rg => rg.title.toLowerCase().trim() === normalized
    );

    const match = exact || result['release-groups'][0];
    return { id: match.id, title: match.title };
  } catch {
    return null;
  }
}

export async function getVinylReleases(
  releaseGroupId: string,
  countries?: string[]
): Promise<VinylData[]> {
  try {
    const result = await mbFetch<{ releases: MBRelease[] }>(
      `https://musicbrainz.org/ws/2/release?release-group=${releaseGroupId}&inc=labels+media&limit=100&fmt=json`
    );

    if (!result.releases) return [];

    const vinyls: VinylData[] = [];

    for (const release of result.releases) {
      const hasVinyl = release.media?.some(m => isVinyl(m.format));
      if (!hasVinyl) continue;

      if (countries?.length && (!release.country || !countries.includes(release.country))) {
        continue;
      }

      const labelInfo = release['label-info']?.[0];
      const format = release.media?.find(m => isVinyl(m.format))?.format;
      const year = release.date ? parseInt(release.date.split('-')[0]) : undefined;

      vinyls.push({
        musicbrainz_release_id: release.id,
        title: release.title,
        country: release.country,
        year: isNaN(year!) ? undefined : year,
        label: labelInfo?.label?.name,
        catalog_number: labelInfo?.['catalog-number'],
        barcode: release.barcode,
        format,
      });
    }

    return vinyls;
  } catch {
    return [];
  }
}

export async function searchAlbumVinyls(
  artist: string,
  title: string,
  countries?: string[]
): Promise<{ releaseGroup: { id: string; title: string } | null; vinyls: VinylData[] }> {
  const releaseGroup = await searchReleaseGroup(artist, title);
  if (!releaseGroup) return { releaseGroup: null, vinyls: [] };

  const vinyls = await getVinylReleases(releaseGroup.id, countries);
  return { releaseGroup, vinyls };
}
