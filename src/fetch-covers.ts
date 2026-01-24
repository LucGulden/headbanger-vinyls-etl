/**
 * Script de récupération des covers depuis Cover Art Archive
 *
 * Ce script met à jour les vinyls qui n'ont pas encore de cover_url
 * en récupérant les images depuis Cover Art Archive.
 *
 * Usage:
 *   npm run fetch:covers
 *   npm run fetch:covers -- --limit=100
 *   npm run fetch:covers -- --clear (recommencer à zéro)
 *
 * Le script peut être interrompu avec Ctrl+C et reprendra où il en était.
 */

import { validateConfig } from '../config/settings.js';
import {
  getVinylsWithoutCover,
  updateVinyl,
  type Vinyl,
} from './utils/supabase.js';
import { getFrontCoverUrl } from './utils/coverart.js';
import {
  runWithProgress,
  clearProgress,
  logError,
} from './utils/progress.js';

const SCRIPT_NAME = 'fetch-covers';

// =============================================================================
// HELPERS
// =============================================================================

function parseArgs(): {
  limit?: number;
  clear?: boolean;
  size?: '250' | '500' | '1200';
} {
  const args: Record<string, string | boolean> = {};

  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value ?? true;
    }
  });

  return {
    limit: args.limit ? parseInt(args.limit as string) : undefined,
    clear: args.clear === true,
    size: (args.size as '250' | '500' | '1200') || '500',
  };
}

// =============================================================================
// TRAITEMENT D'UN VINYL
// =============================================================================

async function processVinyl(
  vinyl: Vinyl,
  index: number,
  total: number,
  size: '250' | '500' | '1200'
): Promise<'success' | 'skipped' | 'error'> {
  const mbId = vinyl.musicbrainz_release_id;

  if (!mbId) {
    return 'skipped';
  }

  // Log minimal pour ne pas surcharger la console
  if (index % 20 === 0 || index === total - 1) {
    console.log(`\n[${index + 1}/${total}] 📸 Récupération des covers...`);
  }

  try {
    const coverUrl = await getFrontCoverUrl(mbId, size);

    if (!coverUrl) {
      // Pas de cover disponible
      return 'skipped';
    }

    // Mettre à jour le vinyl avec l'URL de la cover
    await updateVinyl(vinyl.id!, { cover_url: coverUrl });

    return 'success';
  } catch (error) {
    logError(
      SCRIPT_NAME,
      'fetch-cover',
      mbId,
      vinyl.title,
      error as Error
    );
    return 'error';
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Fetch Covers (Cover Art Archive)');
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

  console.log(`\n🖼️  Taille des images: ${args.size}px`);

  // Récupérer les vinyls sans cover
  console.log('\n📚 Chargement des vinyls sans cover...');

  const limit = args.limit || 1000;
  const vinyls = await getVinylsWithoutCover(limit);

  if (vinyls.length === 0) {
    console.log('\n✨ Tous les vinyls ont déjà une cover!');
    process.exit(0);
  }

  console.log(`📊 ${vinyls.length} vinyls à traiter`);

  // Lancer la récupération avec gestion de la progression
  await runWithProgress(
    SCRIPT_NAME,
    vinyls,
    'fetch-covers',
    (vinyl) => vinyl.id!, // ID unique = vinyl ID
    async (vinyl, index) => {
      return processVinyl(vinyl, index, vinyls.length, args.size || '500');
    }
  );

  console.log('\n✨ Récupération des covers terminée!');
}

main().catch((error) => {
  console.error('\n💥 Erreur fatale:', error);
  process.exit(1);
});
