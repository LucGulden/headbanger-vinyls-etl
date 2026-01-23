/**
 * Client Supabase et fonctions d'accès à la base de données
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config/settings';

// Types pour la base de données FillCrate
export interface Album {
  id?: string;
  spotify_id?: string;
  musicbrainz_release_group_id?: string;
  title: string;
  artist: string;
  cover_url?: string;
  year?: number;
  created_by?: string;
  created_at?: string;
}

export interface Vinyl {
  id?: string;
  album_id: string;
  musicbrainz_release_id?: string;
  title: string;
  artist: string;
  cover_url?: string;
  year?: number;
  label?: string;
  catalog_number?: string;
  country?: string;
  format?: string;
  created_by?: string;
  created_at?: string;
}

// Client Supabase singleton
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseClient;
}

// =============================================================================
// ALBUMS
// =============================================================================

/**
 * Cherche un album par spotify_id
 */
export async function findAlbumBySpotifyId(spotifyId: string): Promise<Album | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('spotify_id', spotifyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/**
 * Cherche un album par musicbrainz_release_group_id
 */
export async function findAlbumByMusicBrainzId(mbId: string): Promise<Album | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('musicbrainz_release_group_id', mbId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/**
 * Cherche un album par titre et artiste (fuzzy)
 */
export async function findAlbumByTitleArtist(title: string, artist: string): Promise<Album | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .ilike('title', title)
    .ilike('artist', artist)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/**
 * Insère un nouvel album
 */
export async function insertAlbum(album: Omit<Album, 'id' | 'created_at'>): Promise<Album> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('albums')
    .insert(album)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Met à jour un album existant
 */
export async function updateAlbum(id: string, updates: Partial<Album>): Promise<Album> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('albums')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upsert album (insert ou update si existe)
 */
export async function upsertAlbum(album: Omit<Album, 'id' | 'created_at'>): Promise<Album> {
  // Chercher d'abord par spotify_id
  if (album.spotify_id) {
    const existing = await findAlbumBySpotifyId(album.spotify_id);
    if (existing) {
      return updateAlbum(existing.id!, album);
    }
  }

  // Sinon chercher par MusicBrainz ID
  if (album.musicbrainz_release_group_id) {
    const existing = await findAlbumByMusicBrainzId(album.musicbrainz_release_group_id);
    if (existing) {
      return updateAlbum(existing.id!, album);
    }
  }

  // Sinon insérer
  return insertAlbum(album);
}

// =============================================================================
// VINYLS
// =============================================================================

/**
 * Cherche un vinyl par musicbrainz_release_id
 */
export async function findVinylByMusicBrainzId(mbId: string): Promise<Vinyl | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('vinyls')
    .select('*')
    .eq('musicbrainz_release_id', mbId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data;
}

/**
 * Insère un nouveau vinyl
 */
export async function insertVinyl(vinyl: Omit<Vinyl, 'id' | 'created_at'>): Promise<Vinyl> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('vinyls')
    .insert(vinyl)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Met à jour un vinyl existant
 */
export async function updateVinyl(id: string, updates: Partial<Vinyl>): Promise<Vinyl> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('vinyls')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upsert vinyl
 */
export async function upsertVinyl(vinyl: Omit<Vinyl, 'id' | 'created_at'>): Promise<Vinyl> {
  if (vinyl.musicbrainz_release_id) {
    const existing = await findVinylByMusicBrainzId(vinyl.musicbrainz_release_id);
    if (existing) {
      return updateVinyl(existing.id!, vinyl);
    }
  }
  return insertVinyl(vinyl);
}

/**
 * Récupère tous les vinyls sans cover_url
 */
export async function getVinylsWithoutCover(limit = 100): Promise<Vinyl[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('vinyls')
    .select('*')
    .is('cover_url', null)
    .not('musicbrainz_release_id', 'is', null)
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Récupère tous les albums avec leur spotify_id pour le matching
 */
export async function getAllAlbumsWithSpotifyId(): Promise<Album[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .not('spotify_id', 'is', null);

  if (error) throw error;
  return data || [];
}
