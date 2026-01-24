/**
 * Phase 2: ENRICH - Recherche MusicBrainz (Release Groups + Vinyles)
 *
 * Usage:
 *   npm run enrich:mb -- --latest
 *   npm run enrich:mb -- --file=data/pipeline_*.json
 *   npm run enrich:mb -- --latest --countries=FR,US
 */

import { config } from '../config/settings.js';
import { searchAlbumVinyls } from './utils/musicbrainz.js';
import { getAllExistingVinylReleaseIds } from './utils/supabase.js';
import {
  loadPipelineState,
  savePipelineState,
  findLatestPipelines,
  recalculateStats,
  printPipelineStats,
} from './utils/json-store.js';

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


async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Phase 2: ENRICH (MusicBrainz)');
  console.log('═══════════════════════════════════════════════════════════════');

  const args = parseArgs();

  // ✅ Charge les vinyls existants EN PREMIER
  console.log('\n📊 Vérification des vinyls existants...');
  const existingReleaseIds = await getAllExistingVinylReleaseIds();
  console.log(`   ✅ ${existingReleaseIds.size} vinyls déjà en BDD\n`);

  let filenames: string[] = [];
  
  if (args.file) {
    filenames = [(args.file as string).replace('data/', '')];
  } else if (args.latest) {
    filenames = findLatestPipelines();
    if (!filenames.length) { console.log('\n⚠️ Aucun fichier pipeline trouvé'); return; }
  } else {
    console.log('\n⚠️ Utilisez --latest ou --file=...');
    return;
  }

  const countries = args.countries
    ? (args.countries as string).split(',')
    : config.vinyl.defaultCountries;

  console.log(`\n📊 Pays: ${countries.join(', ')}`);
  console.log(`📂 ${filenames.length} fichier(s) à traiter:\n`);

  let totalProcessed = 0;
  let totalWithMB = 0;
  let totalWithVinyls = 0;

  for (const filename of filenames) {
    console.log(`\n📂 Fichier: ${filename}`);

    const state = loadPipelineState(filename);
    if (!state) { console.error(`❌ Fichier non trouvé`); continue; }

    console.log(`   ${state.albums.length} albums à enrichir`);

    const toProcess = state.albums.filter(a => a.status === 'extracted' || !a.musicbrainz);

    let processed = 0;
    let withMB = 0;
    let withVinyls = 0;
    let skippedVinyls = 0;  // ✅ Ajoute compteur

    for (const album of toProcess) {
      processed++;
      const artist = album.spotify.artist.split(',')[0].trim();
      const title = album.spotify.title;

      process.stdout.write(`\r   [${processed}/${toProcess.length}] ${artist} - ${title.substring(0, 25).padEnd(25)}`);

      try {
        const result = await searchAlbumVinyls(artist, title, countries);

        // ✅ FILTRER les vinyls: garder seulement les NOUVEAUX
        const newVinyls = result.vinyls.filter(v => !existingReleaseIds.has(v.musicbrainz_release_id));
        const skipped = result.vinyls.length - newVinyls.length;
        if (skipped > 0) skippedVinyls += skipped;

        if (result.releaseGroup) {
          album.musicbrainz = {
            release_group_id: result.releaseGroup.id,
            release_group_title: result.releaseGroup.title,
          };
          withMB++;

          if (newVinyls.length > 0) {  // ✅ Check sur newVinyls
            album.vinyls = newVinyls;  // ✅ Assigné les NOUVEAUX uniquement
            album.status = 'enriched_mb';
            withVinyls++;
          } else {
            album.status = 'skipped';
            album.skip_reason = 'no_new_vinyls';  // ✅ Raison spécifique
          }
        } else {
          album.status = 'skipped';
          album.skip_reason = 'no_mb_match';
        }
      } catch (e) {
        console.log(`\n   ⚠️ ${(e as Error).message}`);
      }

      if (processed % 20 === 0) {
        recalculateStats(state);
        savePipelineState(filename, state);
      }
    }

    state.phase = 'enrich_mb';
    recalculateStats(state);
    savePipelineState(filename, state);

    console.log('\n');
    console.log(`   ✅ Enrichissement terminé`);
    console.log(`      Avec Release Group: ${withMB}`);
    console.log(`      Avec vinyls NOUVEAUX: ${withVinyls}`);
    console.log(`      Vinyls skippés (déjà en BDD): ${skippedVinyls}`);
    console.log(`      Total vinyls: ${state.stats.total_vinyls}`);

    printPipelineStats(state);

    totalProcessed += processed;
    totalWithMB += withMB;
    totalWithVinyls += withVinyls;

    console.log('');
  }

  console.log('\n✨ Terminé!');
  console.log(`   📊 Total: ${totalWithMB} albums avec MB, ${totalWithVinyls} avec NOUVEAUX vinyls`);
  console.log('   Prochaine étape: npm run enrich:covers -- --latest');
}

main().catch(e => { console.error('\n💥', e); process.exit(1); });
