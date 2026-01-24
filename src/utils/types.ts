/**
 * Types partagés pour le pipeline ETL FillCrate
 */

// =============================================================================
// CONFIG TYPES
// =============================================================================

export interface ArtistConfig {
  name: string;
  priority: 'high' | 'medium' | 'low';
  genre: string;
  subGenre?: string;
}

export interface PlaylistConfig {
  id: string;
  name: string;
  description: string;
  genre?: string;
  priority: 'high' | 'medium' | 'low';
  trackNewReleases?: boolean;
  owner:string;
}

// =============================================================================
// SPOTIFY DATA
// =============================================================================

export interface SpotifyAlbumData {
  spotify_id: string;
  spotify_url: string;
  title: string;
  artist: string;
  artist_id: string;
  cover_url?: string;
  year?: number;
  album_type: 'album' | 'single' | 'compilation';
  release_date: string;
}

// =============================================================================
// VINYL DATA
// =============================================================================

export interface VinylData {
  musicbrainz_release_id: string;
  title: string;
  country?: string;
  year?: number;
  label?: string;
  catalog_number?: string;
  barcode?: string;
  format?: string;
  cover_url?: string;
}

// =============================================================================
// PIPELINE DATA (JSON intermédiaire)
// =============================================================================

export interface AlbumPipelineData {
  // Spotify data (Phase 1)
  spotify: SpotifyAlbumData;

  // MusicBrainz data (Phase 2)
  musicbrainz?: {
    release_group_id: string;
    release_group_title: string;
  };
  vinyls: VinylData[];

  // Status tracking
  status: 'extracted' | 'enriched_mb' | 'enriched_covers' | 'loaded' | 'skipped';
  skip_reason?: string;
}

export interface PipelineState {
  // Metadata
  created_at: string;
  updated_at: string;
  source: 'artists' | 'playlist' | 'new-releases';
  source_details: string;

  // Phase tracking
  phase: 'extract' | 'enrich_mb' | 'enrich_covers' | 'load' | 'complete';

  // Data
  albums: AlbumPipelineData[];

  // Stats
  stats: PipelineStats;
}

export interface PipelineStats {
  total_extracted: number;
  total_with_mb: number;
  total_with_vinyls: number;
  total_vinyls: number;
  total_with_covers: number;
  total_loaded_albums: number;
  total_loaded_vinyls: number;
}
