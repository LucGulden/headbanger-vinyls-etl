/**
 * Client Spotify API (Client Credentials Flow)
 */

import { config } from '../../config/settings';

// Types Spotify
export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: { spotify: string };
  genres: string[];
  popularity: number;
  images: { url: string; height: number; width: number }[];
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  total_tracks: number;
  album_type: 'album' | 'single' | 'compilation';
  images: { url: string; height: number; width: number }[];
  external_ids?: { upc?: string; isrc?: string };
  external_urls: { spotify: string };
  uri: string;
}

export interface SpotifySearchResult {
  artists?: { items: SpotifyArtist[]; total: number };
  albums?: { items: SpotifyAlbum[]; total: number };
}

export interface SpotifyArtistAlbumsResult {
  items: SpotifyAlbum[];
  total: number;
  next: string | null;
}

// Token cache
let tokenCache: SpotifyToken | null = null;

/**
 * Obtient un token d'accès Spotify (Client Credentials)
 */
async function getAccessToken(): Promise<string> {
  // Vérifier le cache
  if (tokenCache && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token;
  }

  const credentials = Buffer.from(
    `${config.spotify.clientId}:${config.spotify.clientSecret}`
  ).toString('base64');

  const response = await fetch(config.spotify.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.status}`);
  }

  const data = await response.json();

  tokenCache = {
    ...data,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // Marge de 60s
  };

  return tokenCache.access_token;
}

/**
 * Effectue une requête authentifiée à l'API Spotify
 */
async function spotifyFetch<T>(endpoint: string): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`${config.spotify.apiBaseUrl}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} - ${await response.text()}`);
  }

  return response.json();
}

/**
 * Recherche un artiste par nom
 */
export async function searchArtist(name: string): Promise<SpotifyArtist | null> {
  const encoded = encodeURIComponent(name);
  const result = await spotifyFetch<SpotifySearchResult>(
    `/search?q=${encoded}&type=artist&limit=5`
  );

  if (!result.artists?.items.length) {
    return null;
  }

  // Chercher une correspondance exacte (case insensitive)
  const exactMatch = result.artists.items.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );

  return exactMatch || result.artists.items[0];
}

/**
 * Récupère tous les albums d'un artiste
 */
export async function getArtistAlbums(
  artistId: string,
  includeGroups: string[] = ['album', 'single']
): Promise<SpotifyAlbum[]> {
  const albums: SpotifyAlbum[] = [];
  const groups = includeGroups.join(',');
  let offset = 0;
  const limit = 50;

  while (true) {
    const result = await spotifyFetch<SpotifyArtistAlbumsResult>(
      `/artists/${artistId}/albums?include_groups=${groups}&market=FR&limit=${limit}&offset=${offset}`
    );

    albums.push(...result.items);

    if (!result.next || result.items.length < limit) {
      break;
    }

    offset += limit;

    // Petit délai pour éviter le rate limiting
    await sleep(100);
  }

  return albums;
}

/**
 * Récupère les détails complets d'un album (inclut UPC)
 */
export async function getAlbumDetails(albumId: string): Promise<SpotifyAlbum> {
  return spotifyFetch<SpotifyAlbum>(`/albums/${albumId}`);
}

/**
 * Récupère les new releases
 */
export async function getNewReleases(limit = 50, country = 'FR'): Promise<SpotifyAlbum[]> {
  const result = await spotifyFetch<{ albums: { items: SpotifyAlbum[] } }>(
    `/browse/new-releases?country=${country}&limit=${limit}`
  );
  return result.albums.items;
}

/**
 * Recherche des albums
 */
export async function searchAlbums(query: string, limit = 20): Promise<SpotifyAlbum[]> {
  const encoded = encodeURIComponent(query);
  const result = await spotifyFetch<SpotifySearchResult>(
    `/search?q=${encoded}&type=album&limit=${limit}`
  );
  return result.albums?.items || [];
}

/**
 * Extrait l'année d'une date Spotify
 */
export function extractYear(releaseDate: string): number | undefined {
  if (!releaseDate) return undefined;
  const year = parseInt(releaseDate.split('-')[0], 10);
  return isNaN(year) ? undefined : year;
}

/**
 * Extrait l'URL de cover la plus grande
 */
export function extractCoverUrl(images: SpotifyAlbum['images']): string | undefined {
  if (!images?.length) return undefined;
  // Trier par taille décroissante et prendre la plus grande
  const sorted = [...images].sort((a, b) => (b.height || 0) - (a.height || 0));
  return sorted[0]?.url;
}

/**
 * Convertit un album Spotify en format Album pour la BDD
 */
export function spotifyAlbumToDbAlbum(spotifyAlbum: SpotifyAlbum) {
  return {
    spotify_id: spotifyAlbum.id,
    title: spotifyAlbum.name,
    artist: spotifyAlbum.artists.map((a) => a.name).join(', '),
    cover_url: extractCoverUrl(spotifyAlbum.images),
    year: extractYear(spotifyAlbum.release_date),
  };
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
