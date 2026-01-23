/**
 * Client Cover Art Archive API
 * Documentation: https://musicbrainz.org/doc/Cover_Art_Archive/API
 */

import { config } from '../config/settings.js';

export interface CoverArtImage {
  id: string;
  types: string[];
  front: boolean;
  back: boolean;
  comment: string;
  image: string; // URL de l'image full size
  thumbnails: {
    250?: string;
    500?: string;
    1200?: string;
    small?: string;
    large?: string;
  };
}

export interface CoverArtResponse {
  images: CoverArtImage[];
  release: string; // URL de la release MusicBrainz
}

// Rate limiter (Cover Art Archive est plus permissif que MusicBrainz)
let lastRequestTime = 0;
const RATE_LIMIT_MS = 500; // 2 requêtes par seconde max

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - timeSinceLastRequest);
  }

  lastRequestTime = Date.now();

  return fetch(url, {
    headers: {
      'User-Agent': config.musicBrainz.userAgent,
    },
  });
}

/**
 * Récupère les covers d'une release MusicBrainz
 */
export async function getReleaseCoverArt(releaseId: string): Promise<CoverArtResponse | null> {
  try {
    const url = `${config.coverArtArchive.apiBaseUrl}/release/${releaseId}`;
    const response = await rateLimitedFetch(url);

    if (response.status === 404) {
      // Pas de cover art disponible
      return null;
    }

    if (!response.ok) {
      throw new Error(`Cover Art Archive error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // En cas d'erreur réseau, retourner null plutôt que planter
    console.error(`Error fetching cover art for ${releaseId}:`, error);
    return null;
  }
}

/**
 * Récupère l'URL de la cover front d'une release
 */
export async function getFrontCoverUrl(
  releaseId: string,
  preferredSize: '250' | '500' | '1200' | 'original' = '500'
): Promise<string | null> {
  const coverArt = await getReleaseCoverArt(releaseId);

  if (!coverArt?.images?.length) {
    return null;
  }

  // Chercher la cover "front"
  const frontCover = coverArt.images.find((img) => img.front) || coverArt.images[0];

  if (!frontCover) {
    return null;
  }

  // Retourner la taille préférée ou fallback
  if (preferredSize === 'original') {
    return frontCover.image;
  }

  return (
    frontCover.thumbnails[preferredSize] ||
    frontCover.thumbnails['500'] ||
    frontCover.thumbnails.large ||
    frontCover.image
  );
}

/**
 * Récupère directement l'URL front cover (redirect)
 * Plus rapide que getReleaseCoverArt si on veut juste l'image
 */
export async function getFrontCoverUrlDirect(releaseId: string): Promise<string | null> {
  try {
    const url = `${config.coverArtArchive.apiBaseUrl}/release/${releaseId}/front-500`;
    const response = await rateLimitedFetch(url);

    if (response.status === 404) {
      return null;
    }

    if (response.ok || response.status === 307) {
      // Cover Art Archive redirige vers l'image
      return response.url;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Vérifie si une cover existe pour une release
 */
export async function hasCoverArt(releaseId: string): Promise<boolean> {
  try {
    const url = `${config.coverArtArchive.apiBaseUrl}/release/${releaseId}`;
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': config.musicBrainz.userAgent,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Batch: récupère les covers pour plusieurs releases
 * Retourne un Map<releaseId, coverUrl>
 */
export async function getBatchCoverUrls(
  releaseIds: string[],
  preferredSize: '250' | '500' | '1200' | 'original' = '500'
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  for (const releaseId of releaseIds) {
    const coverUrl = await getFrontCoverUrl(releaseId, preferredSize);
    if (coverUrl) {
      results.set(releaseId, coverUrl);
    }
    // Petit log de progression
    if (results.size % 10 === 0) {
      console.log(`  📸 Covers fetched: ${results.size}/${releaseIds.length}`);
    }
  }

  return results;
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
