/**
 * Script d'import des vinyls depuis MusicBrainz
 *
 * Ce script prend les albums déjà en base et cherche leurs pressages vinyles
 * sur MusicBrainz, filtré par pays (FR par défaut).
 *
 * Usage:
 *   npm run import:vinyls
 *   npm run import:vinyls -- --country=FR
 *   npm run import:vinyls -- --limit=100 (traiter seulement 100 albums)
 *   npm run import:vinyls -- --clear (recommencer à zéro)
 *
 * Le script peut être interrompu avec Ctrl+C et reprendra où il en était.
 */

import { validateConfig, config } from '../config/settings';
import {
  getAllAlbumsWithSpotifyId,
  upsertVinyl,
  findVinylByMusicBrainzId,
  type Album,
} from './utils/supabase.js';
import {
  searchReleases,
  searchReleaseGroups,
  getReleaseGroupReleases,
  filterVinylReleases,
  mbReleaseToDbVinyl,
  type MBRelease,
} from './utils/musicbrainz.js';
import {
  runWithProgress,
  clearProgress,
  logError,
} from './utils/progress.js';

const SCRIPT_NAME = 'import-vinyls';

// =============================================================================
// HELPERS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(): {
  country?: string;
  limit?: number;
  clear?: boolean;
} {
  const args: Record<string, string | boolean> = {};

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value ?? true;
    }
  });

  return {
    country: args.country as string | undefined,
    limit: args.limit ? parseInt(args.limit as string) : undefined,
    clear: args.clear === true,
  };
}

/**
 * Normalise un titre pour améliorer le matching
 */
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\(.*?\)/g, '')     // Retire (Deluxe Edition), etc.
    .replace(/\[.*?\]/g, '')     // Retire [Explicit], etc.
    .replace(/['']/g, "'")       // Normalise les apostrophes
    .replace(/[""]/g, '"')       // Normalise les guillemets
    .trim();
}

// =============================================================================
// TRAITEMENT D'UN ALBUM
// =============================================================================

async function processAlbum(
  album: Album,
  index: number,
  total: number,
  country: string
): Promise<'success' | 'skipped' | 'error'> {
  console.log(`\n[${index + 1}/${total}] 📀 ${album.artist} - ${album.title}`);

  // Normaliser pour la recherche
  const searchArtist = normalizeForSearch(album.artist);
  const searchTitle = normalizeForSearch(album.title);

  // Stratégie 1: Chercher directement les releases vinyles
  let vinylReleases: MBRelease[] = [];

  try {
    // D'abord chercher le Release Group
    const releaseGroups = await searchReleaseGroups(searchArtist, searchTitle);

    if (releaseGroups.length > 0) {
      console.log(`   ✓ Release Group trouvé: ${releaseGroups[0].id}`);

      // Récupérer toutes les releases du groupe
      const allReleases = await getReleaseGroupReleases(releaseGroups[0].id, {
        country,
      });

      // Filtrer pour ne garder que les vinyles
      vinylReleases = filterVinylReleases(allReleases);

      console.log(`   📀 ${allReleases.length} releases, ${vinylReleases.length} vinyles ${country}`);
    } else {
      // Fallback: recherche directe
      console.log(`   ⚠️  Pas de Release Group, recherche directe...`);

      const directReleases = await searchReleases(searchArtist, searchTitle, {
        country,
      });

      vinylReleases = filterVinylReleases(directReleases);
      console.log(`   📀 ${vinylReleases.length} vinyles trouvés`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur MusicBrainz: ${(error as Error).message}`);
    return 'error';
  }

  if (vinylReleases.length === 0) {
    console.log(`   ⏭️  Aucun pressage vinyle ${country} trouvé`);
    return 'skipped';
  }

  // Insérer les vinyls en base
  let inserted = 0;
  let skipped = 0;

  for (const release of vinylReleases) {
    try {
      // Vérifier si déjà en base
      const existing = await findVinylByMusicBrainzId(release.id);

      if (existing) {
        skipped++;
        continue;
      }

      // Convertir et insérer
      const dbVinyl = mbReleaseToDbVinyl(release, album.id!);
      await upsertVinyl(dbVinyl);
      inserted++;

      // Petit délai
      await sleep(50);
    } catch (error) {
      logError(
        SCRIPT_NAME,
        'insert-vinyl',
        release.id,
        `${release.title}`,
        error as Error
      );
    }
  }

  console.log(`   ✅ ${inserted} vinyles insérés, ${skipped} déjà présents`);

  return inserted > 0 ? 'success' : 'skipped';
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Import Vinyls (MusicBrainz)');
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
  const country = args.country || config.import.vinylCountry;

  if (args.clear) {
    console.log('\n🗑️  Effacement de la progression...');
    clearProgress();
  }

  console.log(`\n🌍 Pays de filtrage: ${country}`);

  // Récupérer les albums depuis Supabase
  console.log('\n📚 Chargement des albums depuis la base de données...');

  let albums = await getAllAlbumsWithSpotifyId();

  if (args.limit) {
    albums = albums.slice(0, args.limit);
    console.log(`📋 Limite: ${args.limit} albums`);
  }

  if (albums.length === 0) {
    console.log('\n⚠️  Aucun album en base. Lancez d\'abord import:albums.');
    process.exit(0);
  }

  console.log(`📊 ${albums.length} albums à traiter`);

  // Lancer l'import avec gestion de la progression
  await runWithProgress(
    SCRIPT_NAME,
    albums,
    `import-vinyls-${country}`,
    (album) => album.id!, // ID unique = album ID
    async (album, index) => {
      return processAlbum(album, index, albums.length, country);
    }
  );

  console.log('\n✨ Import terminé!');
}

main().catch((error) => {
  console.error('\n💥 Erreur fatale:', error);
  process.exit(1);
});
