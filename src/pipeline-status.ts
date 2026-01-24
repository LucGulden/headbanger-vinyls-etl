/**
 * Affiche le statut des pipelines existants
 *
 * Usage:
 *   npm run pipeline:status
 */

import {
  listPipelineFiles,
  loadPipelineState,
  printPipelineStats,
} from './utils/json-store.js';

function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Statut des Pipelines');
  console.log('═══════════════════════════════════════════════════════════════');

  const files = listPipelineFiles();

  if (!files.length) {
    console.log('\n   Aucun pipeline trouvé dans data/');
    console.log('   Lancez: npm run extract -- --test');
    return;
  }

  console.log(`\n   ${files.length} pipeline(s) trouvé(s):\n`);

  for (const file of files.sort().reverse()) {
    const state = loadPipelineState(file);
    if (!state) continue;

    console.log(`\n   📁 ${file}`);
    console.log(`      Source: ${state.source} (${state.source_details})`);
    console.log(`      Créé: ${state.created_at.split('T')[0]}`);
    printPipelineStats(state);
  }

  console.log('\n');
}

main();
