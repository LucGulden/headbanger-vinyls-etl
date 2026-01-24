/**
 * Gestion du stockage JSON pour le pipeline ETL
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import type { PipelineState, AlbumPipelineData, PipelineStats } from './types.js';

const DATA_DIR = join(process.cwd(), 'data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

export function getPipelineFilename(source: string, details: string): string {
  const sanitized = details.replace(/[^a-zA-Z0-9-_]/g, '_');
  const date = new Date().toISOString().split('T')[0];
  return `pipeline_${source}_${sanitized}_${date}.json`;
}

export function savePipelineState(filename: string, state: PipelineState): void {
  state.updated_at = new Date().toISOString();
  const filepath = join(DATA_DIR, filename);
  writeFileSync(filepath, JSON.stringify(state, null, 2), 'utf-8');
}

export function loadPipelineState(filename: string): PipelineState | null {
  const filepath = filename.includes('/') ? filename : join(DATA_DIR, filename);
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

export function listPipelineFiles(): string[] {
  if (!existsSync(DATA_DIR)) return [];
  return readdirSync(DATA_DIR).filter(f => f.startsWith('pipeline_') && f.endsWith('.json'));
}

export function findLatestPipelines(): string[] {
  const files = listPipelineFiles();
  if (files.length === 0) return [];
  
  // Extract dates from filenames: pipeline_source_details_DATE.json
  const filesWithDates = files.map(f => {
    const match = f.match(/(\d{4}-\d{2}-\d{2})\.json$/);
    const date = match ? match[1] : '';
    return { file: f, date };
  });
  
  // Find the most recent date
  const latestDate = filesWithDates.sort((a, b) => b.date.localeCompare(a.date))[0]?.date;
  if (!latestDate) return [];
  
  // Return all files from the latest date
  return filesWithDates
    .filter(item => item.date === latestDate)
    .map(item => item.file)
    .sort();
}

// =============================================================================
// PIPELINE STATE
// =============================================================================

export function createPipelineState(source: 'artists' | 'playlist' | 'new-releases', details: string): PipelineState {
  return {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source,
    source_details: details,
    phase: 'extract',
    albums: [],
    stats: createEmptyStats(),
  };
}

function createEmptyStats(): PipelineStats {
  return {
    total_extracted: 0,
    total_with_mb: 0,
    total_with_vinyls: 0,
    total_vinyls: 0,
    total_with_covers: 0,
    total_loaded_albums: 0,
    total_loaded_vinyls: 0,
  };
}

export function recalculateStats(state: PipelineState): void {
  state.stats.total_extracted = state.albums.length;
  state.stats.total_with_mb = state.albums.filter(a => a.musicbrainz).length;
  state.stats.total_with_vinyls = state.albums.filter(a => a.vinyls.length > 0).length;
  state.stats.total_vinyls = state.albums.reduce((sum, a) => sum + a.vinyls.length, 0);
  state.stats.total_with_covers = state.albums.filter(a => a.vinyls.some(v => v.cover_url)).length;
  state.stats.total_loaded_albums = state.albums.filter(a => a.status === 'loaded').length;
  state.stats.total_loaded_vinyls = state.albums
    .filter(a => a.status === 'loaded')
    .reduce((sum, a) => sum + a.vinyls.length, 0);
}

export function printPipelineStats(state: PipelineState): void {
  console.log('\n📊 STATS');
  console.log(`   Phase: ${state.phase}`);
  console.log(`   Albums extraits: ${state.stats.total_extracted}`);
  console.log(`   Avec Release Group MB: ${state.stats.total_with_mb}`);
  console.log(`   Avec vinyles: ${state.stats.total_with_vinyls}`);
  console.log(`   Total vinyles: ${state.stats.total_vinyls}`);
  if (state.stats.total_with_covers > 0) {
    console.log(`   Avec covers: ${state.stats.total_with_covers}`);
  }
  if (state.stats.total_loaded_albums > 0) {
    console.log(`   Chargés en BDD: ${state.stats.total_loaded_albums} albums, ${state.stats.total_loaded_vinyls} vinyles`);
  }
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function deduplicateAlbums(albums: AlbumPipelineData[]): AlbumPipelineData[] {
  const seen = new Map<string, AlbumPipelineData>();

  for (const album of albums) {
    const key = `${normalizeTitle(album.spotify.title)}-${album.spotify.artist.toLowerCase()}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, album);
    } else {
      // Keep oldest (original)
      const existingYear = existing.spotify.year || 9999;
      const currentYear = album.spotify.year || 9999;
      if (currentYear < existingYear) {
        seen.set(key, album);
      }
    }
  }

  return Array.from(seen.values());
}
