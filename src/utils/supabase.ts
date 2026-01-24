/**
 * Client Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/settings.js';
import type { AlbumPipelineData } from './types.js';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }
  return client;
}

export async function albumExists(spotifyId: string, mbId: string): Promise<string | null> {
  const { data } = await getClient()
    .from('albums')
    .select('id')
    .or(`spotify_id.eq.${spotifyId},musicbrainz_release_group_id.eq.${mbId}`)
    .limit(1)
    .single();
  return data?.id || null;
}

export async function vinylExists(mbId: string): Promise<boolean> {
  const { data } = await getClient()
    .from('vinyls')
    .select('id')
    .eq('musicbrainz_release_id', mbId)
    .limit(1)
    .single();
  return !!data;
}

export async function insertAlbum(album: {
  spotify_id: string;
  spotify_url: string;
  musicbrainz_release_group_id: string;
  title: string;
  artist: string;
  cover_url?: string;
  year?: number;
}): Promise<string> {
  const { data, error } = await getClient()
    .from('albums')
    .insert(album)
    .select('id')
    .single();
  if (error) throw new Error(`Insert album failed: ${error.message}`);
  return data.id;
}

export async function insertVinyl(vinyl: {
  album_id: string;
  musicbrainz_release_id: string;
  title: string;
  country?: string;
  year?: number;
  label?: string;
  catalog_number?: string;
  barcode?: string;
  format?: string;
  cover_url?: string;
}): Promise<string> {
  const { data, error } = await getClient()
    .from('vinyls')
    .insert(vinyl)
    .select('id')
    .single();
  if (error) throw new Error(`Insert vinyl failed: ${error.message}`);
  return data.id;
}

export async function loadAlbumWithVinyls(
  albumData: AlbumPipelineData
): Promise<{ albumId: string; vinylCount: number } | null> {
  if (!albumData.musicbrainz || albumData.vinyls.length === 0) return null;

  // Check existing
  const existingId = await albumExists(
    albumData.spotify.spotify_id,
    albumData.musicbrainz.release_group_id
  );

  let albumId: string;

  if (existingId) {
    albumId = existingId;
  } else {
    albumId = await insertAlbum({
      spotify_id: albumData.spotify.spotify_id,
      spotify_url: albumData.spotify.spotify_url,
      musicbrainz_release_group_id: albumData.musicbrainz.release_group_id,
      title: albumData.spotify.title,
      artist: albumData.spotify.artist,
      cover_url: albumData.spotify.cover_url,
      year: albumData.spotify.year,
    });
  }

  let vinylCount = 0;

  for (const vinyl of albumData.vinyls) {
    if (await vinylExists(vinyl.musicbrainz_release_id)) continue;

    await insertVinyl({
      album_id: albumId,
      musicbrainz_release_id: vinyl.musicbrainz_release_id,
      title: vinyl.title,
      country: vinyl.country,
      year: vinyl.year,
      label: vinyl.label,
      catalog_number: vinyl.catalog_number,
      barcode: vinyl.barcode,
      format: vinyl.format,
      cover_url: vinyl.cover_url,
    });
    vinylCount++;
  }

  return { albumId, vinylCount };
}
