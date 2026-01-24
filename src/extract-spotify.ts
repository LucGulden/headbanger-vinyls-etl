/**
 * Phase 1: EXTRACT - Récupération des albums depuis Spotify
 *
 * Usage:
 *   npm run extract -- --test
 *   npm run extract -- --artists
 *   npm run extract -- --all
 *   npm run extract -- --genre=rap-fr
 *   npm run extract -- --playlist=37i9dQZF1DX0XUsuxWHRQd
 *   npm run extract -- --new-releases
 */

import { validateSpotifyConfig } from '../config/settings.js';
import { ALL_ARTISTS } from '../config/artists.js';
import { TEST_ARTISTS } from '../config/artists-test.js';
import { ALL_PLAYLISTS, NEW_RELEASES_TRACKING, getPlaylistsByGenre } from '../config/playlists.js';
import { searchArtist, getArtistAlbums, getPlaylistAlbums } from './utils/spotify.js';
import {
  createPipelineState,
  savePipelineState,
  getPipelineFilename,
  deduplicateAlbums,
  printPipelineStats,
  recalculateStats,
} from './utils/json-store.js';
import type { ArtistConfig, PlaylistConfig, AlbumPipelineData, SpotifyAlbumData } from './utils/types.js';

function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      const camelKey = key.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      args[camelKey] = value ?? true;
    }
  });
  return args;
}

function toAlbumPipeline(spotify: SpotifyAlbumData): AlbumPipelineData {
  return { spotify, vinyls: [], status: 'extracted' };
}

async function extractFromArtists(artists: ArtistConfig[], sourceDetails: string, albumsOnly: boolean): Promise<void> {
  console.log(`\n🎤 Extraction depuis ${artists.length} artistes...`);

  const filename = getPipelineFilename('artists', sourceDetails);
  const state = createPipelineState('artists', sourceDetails);

  const allAlbums: AlbumPipelineData[] = [];
  let processed = 0;
  let notFound = 0;

  for (const artistConfig of artists) {
    processed++;
    process.stdout.write(`\r   [${processed}/${artists.length}] ${artistConfig.name.padEnd(30)}`);

    const artist = await searchArtist(artistConfig.name);
    if (!artist) { notFound++; continue; }

    const albums = await getArtistAlbums(artist.id, albumsOnly ? ['album'] : ['album', 'single']);
    for (const album of albums) {
      allAlbums.push(toAlbumPipeline(album));
    }

    if (processed % 10 === 0) {
      state.albums = deduplicateAlbums(allAlbums);
      recalculateStats(state);
      savePipelineState(filename, state);
    }
  }

  state.albums = deduplicateAlbums(allAlbums);
  recalculateStats(state);
  savePipelineState(filename, state);

  console.log(`\n\n   ✅ ${state.albums.length} albums (${notFound} artistes non trouvés)`);
  printPipelineStats(state);
  console.log(`\n   📁 data/${filename}`);
}

async function extractFromPlaylists(playlists: PlaylistConfig[], sourceDetails: string): Promise<void> {
  console.log(`\n📋 Extraction depuis ${playlists.length} playlist(s)...`);

  const filename = getPipelineFilename('playlist', sourceDetails);
  const state = createPipelineState('playlist', sourceDetails);

  const allAlbums: AlbumPipelineData[] = [];

  for (const playlist of playlists) {
    console.log(`\n   📋 ${playlist.name}...`);
    const albums = await getPlaylistAlbums(playlist.id);
    console.log(`      ${albums.length} albums`);
    for (const album of albums) {
      allAlbums.push(toAlbumPipeline(album));
    }
  }

  state.albums = deduplicateAlbums(allAlbums);
  recalculateStats(state);
  savePipelineState(filename, state);

  console.log(`\n   ✅ ${state.albums.length} albums`);
  printPipelineStats(state);
  console.log(`\n   📁 data/${filename}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Phase 1: EXTRACT (Spotify)');
  console.log('═══════════════════════════════════════════════════════════════');

  try { validateSpotifyConfig(); } catch (e) { console.error(`\n❌ ${(e as Error).message}`); process.exit(1); }

  const args = parseArgs();

  // Playlist modes
  if (args.playlist) {
    const id = args.playlist as string;
    const found = ALL_PLAYLISTS.find(p => p.id === id);
    const playlists = found ? [found] : [{ id, name: 'Custom', description: '', priority: 'high' as const }];
    await extractFromPlaylists(playlists, id);
    return;
  }

  if (args.newReleases) {
    await extractFromPlaylists(NEW_RELEASES_TRACKING, 'new-releases');
    return;
  }

  if (args.playlistGenre) {
    const playlists = getPlaylistsByGenre(args.playlistGenre as string);
    if (!playlists.length) { console.log(`\n⚠️ Aucune playlist pour "${args.playlistGenre}"`); return; }
    await extractFromPlaylists(playlists, `genre-${args.playlistGenre}`);
    return;
  }

  // Artist modes
  const albumsOnly = !!args.albumsOnly;

  // Mode --all: traiter artistes + playlists + new releases
  if (args.all) {
    console.log(`\n📊 Mode ALL: ${ALL_ARTISTS.length} artistes + ${ALL_PLAYLISTS.length} playlists`);

    // 1. Extraction depuis les artistes
    await extractFromArtists(ALL_ARTISTS, 'all-artists', albumsOnly);

    // 2. Extraction depuis les playlists
    await extractFromPlaylists(ALL_PLAYLISTS, 'all-playlists');

    console.log('\n✨ Extraction terminée!');
    console.log('   Prochaine étape: npm run enrich:mb -- --latest');
    return;
  }

  // Mode normal: traiter les artistes uniquement
  let artists: ArtistConfig[] = [];
  let sourceDetails = 'rap';

  if (args.test) { artists = TEST_ARTISTS; sourceDetails = 'test'; }
  else { artists = ALL_ARTISTS; sourceDetails = 'rap'; }

  if (args.genre) {
    artists = artists.filter(a => a.genre === args.genre);
    sourceDetails = args.genre as string;
  }

  if (args.priority) {
    artists = artists.filter(a => a.priority === args.priority);
    sourceDetails += `-${args.priority}`;
  }

  if (!artists.length) {
    console.log('\n⚠️ Options: --test, --all, --genre=X, --priority=X, --playlist=ID, --new-releases');
    return;
  }

  await extractFromArtists(artists, sourceDetails, albumsOnly);
  console.log('\n✨ Extraction terminée!');
  console.log('   Prochaine étape: npm run enrich:mb -- --latest');
}

main().catch(e => { console.error('\n💥', e); process.exit(1); });
