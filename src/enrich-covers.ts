/**
 * Phase 3: ENRICH - Récupération des covers (Cover Art Archive)
 *
 * Usage:
 *   npm run enrich:covers -- --latest
 *   npm run enrich:covers -- --file=data/pipeline_*.json
 */

import { getCoverUrl } from './utils/coverart.js';
import {
  loadPipelineState,
  savePipelineState,
  findLatestPipelines,  // ✅ Changé
  recalculateStats,
  printPipelineStats,
} from './utils/json-store.js';

function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key.replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = value ?? true;
    }
  });
  return args;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Phase 3: ENRICH (Cover Art Archive)');
  console.log('═══════════════════════════════════════════════════════════════');

  const args = parseArgs();

  let filenames: string[] = [];  // ✅ Changé en array
  
  if (args.file) {
    filenames = [(args.file as string).replace('data/', '')];
  } else if (args.latest) {
    filenames = findLatestPipelines();  // ✅ Changé
    if (!filenames.length) { console.log('\n⚠️ Aucun fichier pipeline trouvé'); return; }
  } else {
    console.log('\n⚠️ Utilisez --latest ou --file=...');
    return;
  }

  console.log(`\n📂 ${filenames.length} fichier(s) à traiter:\n`);

  let totalProcessed = 0;
  let totalFound = 0;

  for (const filename of filenames) {  // ✅ Boucle sur chaque fichier
    console.log(`📂 Fichier: ${filename}`);

    const state = loadPipelineState(filename);
    if (!state) { console.error(`❌ Fichier non trouvé`); continue; }

    // Collect vinyls without cover
    const toProcess: { albumIdx: number; vinylIdx: number; releaseId: string }[] = [];
    state.albums.forEach((album, ai) => {
      album.vinyls.forEach((vinyl, vi) => {
        if (!vinyl.cover_url) {
          toProcess.push({ albumIdx: ai, vinylIdx: vi, releaseId: vinyl.musicbrainz_release_id });
        }
      });
    });

    console.log(`   ${toProcess.length} vinyles sans cover`);

    if (!toProcess.length) {
      console.log('   ✅ Tous les vinyles ont une cover\n');
      continue;
    }

    let processed = 0;
    let found = 0;

    for (const item of toProcess) {
      processed++;
      const vinyl = state.albums[item.albumIdx].vinyls[item.vinylIdx];
      const album = state.albums[item.albumIdx];

      process.stdout.write(`\r   [${processed}/${toProcess.length}] ${album.spotify.artist.substring(0, 15)} - ${vinyl.title.substring(0, 20).padEnd(20)}`);

      const coverUrl = await getCoverUrl(item.releaseId);
      if (coverUrl) {
        vinyl.cover_url = coverUrl;
        found++;
      }

      if (processed % 50 === 0) {
        recalculateStats(state);
        savePipelineState(filename, state);
      }
    }

    // Update status
    for (const album of state.albums) {
      if (album.status === 'enriched_mb' && album.vinyls.some(v => v.cover_url)) {
        album.status = 'enriched_covers';
      }
    }

    state.phase = 'enrich_covers';
    recalculateStats(state);
    savePipelineState(filename, state);

    console.log('\n');
    console.log(`   ✅ Covers trouvées: ${found}/${toProcess.length}\n`);

    printPipelineStats(state);

    totalProcessed += processed;
    totalFound += found;
  }

  console.log('\n✨ Terminé!');
  console.log(`   📊 Total: ${totalFound} covers trouvées`);
  console.log('   Prochaine étape: npm run load -- --latest');
}

main().catch(e => { console.error('\n💥', e); process.exit(1); });
