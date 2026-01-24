/**
 * Client Spotify API
 */

import { config } from '../../config/settings.js';
import type { SpotifyAlbumData } from './types.js';

// Types
interface SpotifyArtist { id: string; name: string; }
interface SpotifyImage { url: string; height: number; }
interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  release_date: string;
  album_type: 'album' | 'single' | 'compilation';
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

// Auth
let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry - 60000) return accessToken;

  const credentials = Buffer.from(
    `${config.spotify.clientId}:${config.spotify.clientSecret}`
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) throw new Error(`Spotify auth failed: ${response.status}`);

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return accessToken;
}

async function spotifyFetch<T>(endpoint: string): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
    await sleep(retryAfter * 1000);
    return spotifyFetch(endpoint);
  }

  if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
  return response.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Conversion
function toSpotifyAlbumData(album: SpotifyAlbum): SpotifyAlbumData {
  const year = album.release_date ? parseInt(album.release_date.split('-')[0]) : undefined;
  const cover = album.images.find(img => img.height === 300)?.url || album.images[0]?.url;

  return {
    spotify_id: album.id,
    spotify_url: `https://open.spotify.com/album/${album.id}`,
    title: album.name,
    artist: album.artists.map(a => a.name).join(', '),
    artist_id: album.artists[0]?.id || '',
    cover_url: cover,
    year: isNaN(year!) ? undefined : year,
    album_type: album.album_type,
    release_date: album.release_date,
  };
}

// Public API
export async function searchArtist(name: string): Promise<{ id: string; name: string } | null> {
  const query = encodeURIComponent(name);
  const result = await spotifyFetch<{ artists: { items: SpotifyArtist[] } }>(
    `/search?q=${query}&type=artist&limit=1`
  );
  return result.artists.items[0] || null;
}

export async function getArtistAlbums(
  artistId: string,
  includeGroups = ['album', 'single']
): Promise<SpotifyAlbumData[]> {
  const albums: SpotifyAlbumData[] = [];
  let offset = 0;

  while (true) {
    const result = await spotifyFetch<{ items: SpotifyAlbum[]; next: string | null }>(
      `/artists/${artistId}/albums?include_groups=${includeGroups.join(',')}&market=FR&limit=50&offset=${offset}`
    );

    for (const album of result.items) {
      albums.push(toSpotifyAlbumData(album));
    }

    if (!result.next) break;
    offset += 50;
    await sleep(100);
  }

  return albums;
}

export async function getPlaylistAlbums(playlistId: string): Promise<SpotifyAlbumData[]> {
  const albums: SpotifyAlbumData[] = [];
  const seen = new Set<string>();
  let offset = 0;

  while (true) {
    const result = await spotifyFetch<{
      items: { track: { album: SpotifyAlbum } | null }[];
      next: string | null;
    }>(
      `/playlists/${playlistId}/tracks?market=FR&limit=100&offset=${offset}`
    );

    for (const item of result.items) {
      if (item.track?.album && !seen.has(item.track.album.id)) {
        seen.add(item.track.album.id);
        albums.push(toSpotifyAlbumData(item.track.album));
      }
    }

    if (!result.next) break;
    offset += 100;
    await sleep(100);
  }

  return albums;
}
