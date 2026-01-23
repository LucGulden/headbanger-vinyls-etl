/**
 * Script d'import des albums depuis Spotify
 *
 * Usage:
 *   npm run import:albums
 *   npm run import:albums -- --priority=high
 *   npm run import:albums -- --genre=rap-fr
 *   npm run import:albums -- --artist="Nas"
 *   npm run import:albums -- --clear (recommencer à zéro)
 *
 * Le script peut être interrompu avec Ctrl+C et reprendra où il en était.
 */

import { validateConfig, config } from '../config/settings';
import {
  ALL_ARTISTS,
  getArtistsByPriority,
  getArtistsByGenre,
  type ArtistConfig,
} from '../config/artists.js';
import {
  searchArtist,
  getArtistAlbums,
  spotifyAlbumToDbAlbum,
  type SpotifyAlbum,
} from './utils/spotify.js';
import { upsertAlbum, findAlbumBySpotifyId } from './utils/supabase.js';
import {
  runWithProgress,
  clearProgress,
  logError,
} from './utils/progress.js';

const SCRIPT_NAME = 'import-albums';

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
  albumsOnly?: boolean; // Importer seulement les albums (pas singles)
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

  // 1. Chercher l'artiste sur Spotify
  const spotifyArtist = await searchArtist(artistConfig.name);

  if (!spotifyArtist) {
    console.log(`   ⚠️  Artiste non trouvé sur Spotify`);
    return 'skipped';
  }

  console.log(`   ✓ Spotify ID: ${spotifyArtist.id}`);

  // 2. Récupérer ses albums
  const includeGroups = albumsOnly ? ['album'] : ['album', 'single'];
  const albums = await getArtistAlbums(spotifyArtist.id, includeGroups);

  console.log(`   📀 ${albums.length} releases trouvées`);

  if (albums.length === 0) {
    return 'skipped';
  }

  // 3. Dédupliquer (Spotify peut retourner des doublons entre marchés)
  const uniqueAlbums = deduplicateAlbums(albums);
  console.log(`   📀 ${uniqueAlbums.length} albums uniques après déduplication`);

  // 4. Insérer en base
  let inserted = 0;
  let skipped = 0;

  for (const album of uniqueAlbums) {
    try {
      // Vérifier si déjà en base
      const existing = await findAlbumBySpotifyId(album.id);

      if (existing) {
        skipped++;
        continue;
      }

      // Convertir et insérer
      const dbAlbum = spotifyAlbumToDbAlbum(album);
      await upsertAlbum(dbAlbum);
      inserted++;

      // Petit délai pour éviter de surcharger Supabase
      await sleep(50);
    } catch (error) {
      logError(
        SCRIPT_NAME,
        'insert-album',
        album.id,
        `${album.artists[0]?.name} - ${album.name}`,
        error as Error
      );
    }
  }

  console.log(`   ✅ ${inserted} insérés, ${skipped} déjà présents`);

  return 'success';
}

/**
 * Déduplique les albums Spotify (même nom = même album)
 * Garde la version la plus récente/complète
 */
function deduplicateAlbums(albums: SpotifyAlbum[]): SpotifyAlbum[] {
  const seen = new Map<string, SpotifyAlbum>();

  for (const album of albums) {
    // Clé de déduplication: nom normalisé + type
    const key = `${normalizeTitle(album.name)}-${album.album_type}`;

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, album);
    } else {
      // Garder celui avec le plus de tracks (probablement plus complet)
      if (album.total_tracks > existing.total_tracks) {
        seen.set(key, album);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Normalise un titre pour la comparaison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // Retire les parenthèses
    .replace(/\[.*?\]/g, '') // Retire les crochets
    .replace(/[^\w\s]/g, '') // Retire la ponctuation
    .replace(/\s+/g, ' ')    // Normalise les espaces
    .trim();
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Import Albums (Spotify)');
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

  if (artists.length === 0) {
    console.log('\n⚠️  Aucun artiste correspondant aux filtres.');
    process.exit(0);
  }

  console.log(`\n📊 ${artists.length} artistes à traiter`);

  // Lancer l'import avec gestion de la progression
  await runWithProgress(
    SCRIPT_NAME,
    artists,
    'import-artists',
    (artist) => artist.name, // ID unique = nom de l'artiste
    async (artist, index) => {
      return processArtist(artist, index, artists.length, args.albumsOnly ?? false);
    }
  );

  console.log('\n✨ Import terminé!');
}

main().catch((error) => {
  console.error('\n💥 Erreur fatale:', error);
  process.exit(1);
});
