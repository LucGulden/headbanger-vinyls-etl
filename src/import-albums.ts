/**
 * Script d'import des albums depuis Spotify avec correspondance MusicBrainz obligatoire
 *
 * Flow:
 * 1. Chercher l'artiste sur Spotify
 * 2. Récupérer ses albums
 * 3. Pour chaque album, chercher le Release Group MusicBrainz correspondant
 * 4. Si plusieurs albums Spotify → même Release Group → garder l'original (année la plus ancienne)
 * 5. Insérer seulement les albums avec correspondance MB
 *
 * Usage:
 *   npm run import:albums
 *   npm run import:albums -- --test          (dataset de test réduit)
 *   npm run import:albums -- --priority=high
 *   npm run import:albums -- --genre=rap-fr
 *   npm run import:albums -- --artist="Nas"
 *   npm run import:albums -- --all           (traiter artistes + playlists)
 *   npm run import:albums -- --clear         (recommencer à zéro)
 *
 * Le script peut être interrompu avec Ctrl+C et reprendra où il en était.
 */

import { validateConfig } from '../config/settings.js';
import {
  ALL_ARTISTS,
  getArtistsByPriority,
  type ArtistConfig,
} from '../config/artists.js';
import { TEST_ARTISTS } from '../config/artists-test.js';
import { ALL_PLAYLISTS } from '../config/playlists.js';
import {
  searchArtist,
  getArtistAlbums,
  getPlaylistAlbums,
} from './utils/spotify.js';
import type { SpotifyAlbumData } from './utils/types.js';
import {
  searchReleaseGroup,
} from './utils/musicbrainz.js';
import { insertAlbum, albumExists } from './utils/supabase.js';
import {
  runWithProgress,
  clearProgress,
  logError,
} from './utils/progress.js';
import type { PlaylistConfig } from './utils/types.js';

const SCRIPT_NAME = 'import-albums';

// =============================================================================
// TRACKING DES ÉCHECS POUR LE RÉCAP
// =============================================================================

interface FailureReport {
  artistsNotFound: string[];
  artistsNoAlbums: string[];
  albumsNoMBMatch: { artist: string; album: string }[];
  stats: {
    totalArtists: number;
    successArtists: number;
    totalAlbumsProcessed: number;
    albumsWithMB: number;
    albumsMerged: number;
    albumsInserted: number;
    albumsSkipped: number;
  };
}

const failureReport: FailureReport = {
  artistsNotFound: [],
  artistsNoAlbums: [],
  albumsNoMBMatch: [],
  stats: {
    totalArtists: 0,
    successArtists: 0,
    totalAlbumsProcessed: 0,
    albumsWithMB: 0,
    albumsMerged: 0,
    albumsInserted: 0,
    albumsSkipped: 0,
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): {
  priority?: 'high' | 'medium' | 'low';
  genre?: string;
  artist?: string;
  clear?: boolean;
  test?: boolean;
  albumsOnly?: boolean;
  all?: boolean;
} {
  const args: Record<string, string | boolean> = {};

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value ?? true;
    }
  });

  return args as ReturnType<typeof parseArgs>;
}

function filterArtists(args: ReturnType<typeof parseArgs>): ArtistConfig[] {
  // Mode test
  if (args.test) {
    console.log(`🧪 Mode TEST: ${TEST_ARTISTS.length} artistes`);
    return TEST_ARTISTS;
  }

  let artists = ALL_ARTISTS;

  if (args.priority) {
    artists = getArtistsByPriority(args.priority);
    console.log(`📋 Filtre: priorité ${args.priority} (${artists.length} artistes)`);
  }

  if (args.genre) {
    artists = artists.filter((a) => a.genre === args.genre);
    console.log(`📋 Filtre: genre ${args.genre} (${artists.length} artistes)`);
  }

  if (args.artist) {
    artists = artists.filter(
      (a) => a.name.toLowerCase() === args.artist!.toLowerCase()
    );
    console.log(`📋 Filtre: artiste "${args.artist}" (${artists.length} trouvé)`);
  }

  return artists;
}

/**
 * Normalise un titre pour la comparaison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // Retire les parenthèses (Deluxe, Remastered, etc.)
    .replace(/\[.*?\]/g, '') // Retire les crochets
    .replace(/[^\w\s]/g, '') // Retire la ponctuation
    .replace(/\s+/g, ' ')    // Normalise les espaces
    .trim();
}

/**
 * Normalise pour la recherche MusicBrainz
 */
function normalizeForMBSearch(text: string): string {
  return text
    .replace(/['']/g, "'")   // Normalise les apostrophes
    .replace(/[""]/g, '"')   // Normalise les guillemets
    .trim();
}

// =============================================================================
// RECHERCHE MUSICBRAINZ
// =============================================================================

interface MBReleaseGroup {
  id: string;
  title: string;
}

interface AlbumWithMB {
  spotifyAlbum: SpotifyAlbumData;
  mbReleaseGroup: MBReleaseGroup;
}

/**
 * Cherche la correspondance MusicBrainz pour un album Spotify
 */
async function findMBReleaseGroup(
  artist: string,
  albumTitle: string
): Promise<MBReleaseGroup | null> {
  const searchArtist = normalizeForMBSearch(artist);
  const searchTitle = normalizeForMBSearch(albumTitle);

  try {
    const result = await searchReleaseGroup(searchArtist, searchTitle);
    return result;
  } catch (error) {
    console.log(`      ⚠️  Erreur MB: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Groupe les albums par Release Group MB et garde l'original (année la plus ancienne)
 */
function mergeAlbumsByReleaseGroup(albums: AlbumWithMB[]): AlbumWithMB[] {
  const grouped = new Map<string, AlbumWithMB[]>();

  // Grouper par MB Release Group ID
  for (const album of albums) {
    const mbId = album.mbReleaseGroup.id;
    if (!grouped.has(mbId)) {
      grouped.set(mbId, []);
    }
    grouped.get(mbId)!.push(album);
  }

  // Pour chaque groupe, garder l'album original (année la plus ancienne)
  const merged: AlbumWithMB[] = [];
  let mergeCount = 0;

  for (const [mbId, group] of grouped) {
    if (group.length > 1) {
      // Trier par année croissante, garder le plus ancien
      group.sort((a, b) => {
        const yearA = parseInt(a.spotifyAlbum.release_date.split('-')[0]) || 9999;
        const yearB = parseInt(b.spotifyAlbum.release_date.split('-')[0]) || 9999;
        return yearA - yearB;
      });

      const kept = group[0];
      const discarded = group.slice(1);

      console.log(`      🔀 Fusion: "${kept.spotifyAlbum.title}" (${kept.spotifyAlbum.release_date.split('-')[0]})`);
      for (const d of discarded) {
        console.log(`         ↳ absorbe "${d.spotifyAlbum.title}" (${d.spotifyAlbum.release_date.split('-')[0]})`);
      }

      merged.push(kept);
      mergeCount += discarded.length;
    } else {
      merged.push(group[0]);
    }
  }

  if (mergeCount > 0) {
    failureReport.stats.albumsMerged += mergeCount;
  }

  return merged;
}

// =============================================================================
// TRAITEMENT D'UN ARTISTE
// =============================================================================

async function processArtist(
  artistConfig: ArtistConfig,
  index: number,
  total: number,
  albumsOnly: boolean
): Promise<'success' | 'skipped' | 'error'> {
  console.log(`\n[${index + 1}/${total}] 🎤 ${artistConfig.name}`);
  failureReport.stats.totalArtists++;

  // 1. Chercher l'artiste sur Spotify
  const spotifyArtist = await searchArtist(artistConfig.name);

  if (!spotifyArtist) {
    console.log(`   ⚠️  Artiste non trouvé sur Spotify`);
    failureReport.artistsNotFound.push(artistConfig.name);
    return 'skipped';
  }

  console.log(`   ✓ Spotify ID: ${spotifyArtist.id}`);

  // 2. Récupérer ses albums
  const includeGroups = albumsOnly ? ['album'] : ['album', 'single'];
  const albums = await getArtistAlbums(spotifyArtist.id, includeGroups);

  console.log(`   📀 ${albums.length} releases Spotify`);

  if (albums.length === 0) {
    failureReport.artistsNoAlbums.push(artistConfig.name);
    return 'skipped';
  }

  // 3. Dédupliquer les albums Spotify (par titre normalisé)
  const uniqueAlbums = deduplicateSpotifyAlbums(albums);
  console.log(`   📀 ${uniqueAlbums.length} albums uniques`);

  failureReport.stats.totalAlbumsProcessed += uniqueAlbums.length;

  // 4. Pour chaque album, chercher correspondance MusicBrainz
  console.log(`   🔍 Recherche MusicBrainz...`);

  const albumsWithMB: AlbumWithMB[] = [];

  for (const album of uniqueAlbums) {
    const artistName = album.artist || artistConfig.name;
    const mbReleaseGroup = await findMBReleaseGroup(artistName, album.title);

    if (mbReleaseGroup) {
      albumsWithMB.push({ spotifyAlbum: album, mbReleaseGroup });
    } else {
      failureReport.albumsNoMBMatch.push({
        artist: artistConfig.name,
        album: album.title,
      });
    }

    // Rate limiting MusicBrainz
    await sleep(1100);
  }

  console.log(`   ✓ ${albumsWithMB.length}/${uniqueAlbums.length} avec correspondance MB`);
  failureReport.stats.albumsWithMB += albumsWithMB.length;

  if (albumsWithMB.length === 0) {
    return 'skipped';
  }

  // 5. Fusionner les albums qui pointent vers le même Release Group
  const mergedAlbums = mergeAlbumsByReleaseGroup(albumsWithMB);
  console.log(`   📀 ${mergedAlbums.length} albums après fusion`);

  // 6. Insérer en base
  let inserted = 0;
  let skipped = 0;

  for (const { spotifyAlbum, mbReleaseGroup } of mergedAlbums) {
    try {
      // Vérifier si déjà en base (par Spotify ID ou MB ID)
      const existing = await albumExists(spotifyAlbum.spotify_id, mbReleaseGroup.id);

      if (existing) {
        skipped++;
        failureReport.stats.albumsSkipped++;
        continue;
      }

      // Convertir et insérer
      const dbAlbum = {
        ...spotifyAlbum,
        musicbrainz_release_group_id: mbReleaseGroup.id,
      };

      await insertAlbum(dbAlbum);
      inserted++;
      failureReport.stats.albumsInserted++;

      // Petit délai pour éviter de surcharger Supabase
      await sleep(50);
    } catch (error) {
      logError(
        SCRIPT_NAME,
        'insert-album',
        spotifyAlbum.spotify_id,
        `${spotifyAlbum.artist} - ${spotifyAlbum.title}`,
        error as Error
      );
    }
  }

  console.log(`   ✅ ${inserted} insérés, ${skipped} déjà présents`);

  failureReport.stats.successArtists++;
  return 'success';
}

/**
 * Déduplique les albums Spotify (même nom = même album)
 * Garde la version la plus ancienne (originale)
 */
function deduplicateSpotifyAlbums(albums: SpotifyAlbumData[]): SpotifyAlbumData[] {
  const seen = new Map<string, SpotifyAlbumData>();

  for (const album of albums) {
    // Clé de déduplication: nom normalisé + type
    const key = `${normalizeTitle(album.title)}-${album.album_type}`;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, album);
    } else {
      // Garder le plus ancien (original)
      const existingYear = parseInt(existing.release_date.split('-')[0]) || 9999;
      const currentYear = parseInt(album.release_date.split('-')[0]) || 9999;

      if (currentYear < existingYear) {
        seen.set(key, album);
      }
    }
  }

  return Array.from(seen.values());
}

// =============================================================================
// TRAITEMENT D'UNE PLAYLIST
// =============================================================================

async function processPlaylist(
  playlistConfig: PlaylistConfig,
  index: number,
  total: number
): Promise<'success' | 'skipped' | 'error'> {
  console.log(`\n[${index + 1}/${total}] 📻 ${playlistConfig.name}`);

  // 1. Récupérer les albums de la playlist
  console.log(`   🔍 Récupération des albums depuis la playlist...`);
  const albums = await getPlaylistAlbums(playlistConfig.id);

  console.log(`   📀 ${albums.length} albums trouvés`);

  if (albums.length === 0) {
    return 'skipped';
  }

  // 2. Dédupliquer les albums
  const uniqueAlbums = deduplicateSpotifyAlbums(albums);
  console.log(`   📀 ${uniqueAlbums.length} albums uniques`);

  failureReport.stats.totalAlbumsProcessed += uniqueAlbums.length;

  // 3. Pour chaque album, chercher correspondance MusicBrainz
  console.log(`   🔍 Recherche MusicBrainz...`);

  const albumsWithMB: AlbumWithMB[] = [];

  for (const album of uniqueAlbums) {
    const mbReleaseGroup = await findMBReleaseGroup(album.artist, album.title);

    if (mbReleaseGroup) {
      albumsWithMB.push({ spotifyAlbum: album, mbReleaseGroup });
    } else {
      failureReport.albumsNoMBMatch.push({
        artist: album.artist,
        album: album.title,
      });
    }

    // Rate limiting MusicBrainz
    await sleep(1100);
  }

  console.log(`   ✓ ${albumsWithMB.length}/${uniqueAlbums.length} avec correspondance MB`);
  failureReport.stats.albumsWithMB += albumsWithMB.length;

  if (albumsWithMB.length === 0) {
    return 'skipped';
  }

  // 4. Fusionner les albums qui pointent vers le même Release Group
  const mergedAlbums = mergeAlbumsByReleaseGroup(albumsWithMB);
  console.log(`   📀 ${mergedAlbums.length} albums après fusion`);

  // 5. Insérer en base
  let inserted = 0;
  let skipped = 0;

  for (const { spotifyAlbum, mbReleaseGroup } of mergedAlbums) {
    try {
      // Vérifier si déjà en base (par Spotify ID ou MB ID)
      const existing = await albumExists(spotifyAlbum.spotify_id, mbReleaseGroup.id);

      if (existing) {
        skipped++;
        failureReport.stats.albumsSkipped++;
        continue;
      }

      // Convertir et insérer
      const dbAlbum = {
        ...spotifyAlbum,
        musicbrainz_release_group_id: mbReleaseGroup.id,
      };

      await insertAlbum(dbAlbum);
      inserted++;
      failureReport.stats.albumsInserted++;

      // Petit délai pour éviter de surcharger Supabase
      await sleep(50);
    } catch (error) {
      logError(
        SCRIPT_NAME,
        'insert-album',
        spotifyAlbum.spotify_id,
        `${spotifyAlbum.artist} - ${spotifyAlbum.title}`,
        error as Error
      );
    }
  }

  console.log(`   ✅ ${inserted} insérés, ${skipped} déjà présents`);

  failureReport.stats.successArtists++;
  return 'success';
}

// =============================================================================
// RÉCAP FINAL
// =============================================================================

function printFailureReport(): void {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   RÉCAPITULATIF');
  console.log('═══════════════════════════════════════════════════════════════');

  // Stats globales
  console.log('\n📊 STATISTIQUES GLOBALES');
  console.log(`   Artistes traités: ${failureReport.stats.totalArtists}`);
  console.log(`   Artistes avec résultats: ${failureReport.stats.successArtists}`);
  console.log(`   Albums Spotify analysés: ${failureReport.stats.totalAlbumsProcessed}`);
  console.log(`   Albums avec correspondance MB: ${failureReport.stats.albumsWithMB}`);
  console.log(`   Albums fusionnés (rééditions): ${failureReport.stats.albumsMerged}`);
  console.log(`   Albums insérés en base: ${failureReport.stats.albumsInserted}`);
  console.log(`   Albums déjà présents: ${failureReport.stats.albumsSkipped}`);

  // Artistes non trouvés sur Spotify
  if (failureReport.artistsNotFound.length > 0) {
    console.log('\n❌ ARTISTES NON TROUVÉS SUR SPOTIFY');
    for (const artist of failureReport.artistsNotFound) {
      console.log(`   • ${artist}`);
    }
  }

  // Artistes sans albums
  if (failureReport.artistsNoAlbums.length > 0) {
    console.log('\n⚠️  ARTISTES SANS ALBUMS');
    for (const artist of failureReport.artistsNoAlbums) {
      console.log(`   • ${artist}`);
    }
  }

  // Albums sans correspondance MB (groupés par artiste)
  if (failureReport.albumsNoMBMatch.length > 0) {
    console.log('\n🔍 ALBUMS SANS CORRESPONDANCE MUSICBRAINZ');

    const byArtist = new Map<string, string[]>();
    for (const { artist, album } of failureReport.albumsNoMBMatch) {
      if (!byArtist.has(artist)) {
        byArtist.set(artist, []);
      }
      byArtist.get(artist)!.push(album);
    }

    for (const [artist, albums] of byArtist) {
      console.log(`   ${artist}:`);
      for (const album of albums.slice(0, 5)) {
        console.log(`      • ${album}`);
      }
      if (albums.length > 5) {
        console.log(`      ... et ${albums.length - 5} autres`);
      }
    }

    console.log(`\n   Total: ${failureReport.albumsNoMBMatch.length} albums sans correspondance MB`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Import Albums (Spotify + MusicBrainz)');
  console.log('═══════════════════════════════════════════════════════════════');

  // Valider la configuration
  try {
    validateConfig();
  } catch (error) {
    console.error(`\n❌ ${(error as Error).message}`);
    console.error('\n📝 Copiez .env.example vers .env et remplissez les valeurs.');
    process.exit(1);
  }

  // Parser les arguments
  const args = parseArgs();

  if (args.clear) {
    console.log('\n🗑️  Effacement de la progression...');
    clearProgress();
  }

  // Filtrer les artistes
  const artists = filterArtists(args);

  if (artists.length === 0 && !args.all) {
    console.log('\n⚠️  Aucun artiste correspondant aux filtres.');
    process.exit(0);
  }

  // Mode "all": traiter à la fois les artistes et les playlists
  if (args.all) {
    console.log(`\n📊 Mode ALL: ${artists.length} artistes + ${ALL_PLAYLISTS.length} playlists à traiter`);
    console.log('📝 Seuls les albums avec correspondance MusicBrainz seront importés');

    // 1. Traiter les artistes
    if (artists.length > 0) {
      console.log(`\n\n${'='.repeat(70)}`);
      console.log('   TRAITEMENT DES ARTISTES');
      console.log('='.repeat(70));

      await runWithProgress(
        SCRIPT_NAME,
        artists,
        'import-artists-with-mb',
        (artist) => artist.name,
        async (artist, index) => {
          return processArtist(artist, index, artists.length, args.albumsOnly ?? false);
        }
      );
    }

    // 2. Traiter les playlists
    console.log(`\n\n${'='.repeat(70)}`);
    console.log('   TRAITEMENT DES PLAYLISTS');
    console.log('='.repeat(70));

    await runWithProgress(
      SCRIPT_NAME,
      ALL_PLAYLISTS,
      'import-playlists-with-mb',
      (playlist) => playlist.name,
      async (playlist, index) => {
        return processPlaylist(playlist, index, ALL_PLAYLISTS.length);
      }
    );
  } else {
    // Mode normal: traiter seulement les artistes
    console.log(`\n📊 ${artists.length} artistes à traiter`);
    console.log('📝 Seuls les albums avec correspondance MusicBrainz seront importés');

    await runWithProgress(
      SCRIPT_NAME,
      artists,
      'import-artists-with-mb',
      (artist) => artist.name,
      async (artist, index) => {
        return processArtist(artist, index, artists.length, args.albumsOnly ?? false);
      }
    );
  }

  // Afficher le récap
  printFailureReport();

  console.log('\n✨ Import terminé!');
}

main().catch((error) => {
  console.error('\n💥 Erreur fatale:', error);
  process.exit(1);
});
