/**
 * Phase 4: LOAD - Chargement en base de données Supabase
 *
 * Usage:
 *   npm run load -- --latest
 *   npm run load -- --latest --dry-run
 *   npm run load -- --file=data/pipeline_*.json
 */

import { validateSupabaseConfig } from '../config/settings.js';
import { loadAlbumWithVinyls } from './utils/supabase.js';
import {
  loadPipelineState,
  savePipelineState,
  findLatestPipeline,
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - Phase 4: LOAD (Supabase)');
  console.log('═══════════════════════════════════════════════════════════════');

  const args = parseArgs();
  const dryRun = !!args.dryRun;

  if (!dryRun) {
    try { validateSupabaseConfig(); } catch (e) { console.error(`\n❌ ${(e as Error).message}`); process.exit(1); }
  }

  let filename: string | null = null;
  if (args.file) {
    filename = (args.file as string).replace('data/', '');
  } else if (args.latest) {
    filename = findLatestPipeline();
    if (!filename) { console.log('\n⚠️ Aucun fichier pipeline trouvé'); return; }
  } else {
    console.log('\n⚠️ Utilisez --latest ou --file=...');
    return;
  }

  console.log(`\n📂 Fichier: ${filename}`);

  const state = loadPipelineState(filename);
  if (!state) { console.error(`❌ Fichier non trouvé`); process.exit(1); }

  // Filter albums with vinyls
  const toLoad = state.albums.filter(a =>
    a.vinyls.length > 0 &&
    a.musicbrainz &&
    (a.status === 'enriched_mb' || a.status === 'enriched_covers')
  );

  const totalVinyls = toLoad.reduce((sum, a) => sum + a.vinyls.length, 0);

  console.log(`   ${toLoad.length} albums à charger (${totalVinyls} vinyles)`);

  if (dryRun) {
    console.log('\n   🔍 MODE DRY-RUN\n');
    for (const album of toLoad.slice(0, 10)) {
      console.log(`      • ${album.spotify.artist} - ${album.spotify.title}`);
      console.log(`        ${album.vinyls.length} vinyle(s): ${album.vinyls.map(v => v.country).join(', ')}`);
    }
    if (toLoad.length > 10) console.log(`      ... et ${toLoad.length - 10} autres`);
    return;
  }

  console.log('\n');

  let processed = 0;
  let albumsLoaded = 0;
  let vinylsLoaded = 0;
  let errors = 0;

  for (const album of toLoad) {
    processed++;
    process.stdout.write(`\r   [${processed}/${toLoad.length}] ${album.spotify.artist.substring(0, 15)} - ${album.spotify.title.substring(0, 20).padEnd(20)}`);

    try {
      const result = await loadAlbumWithVinyls(album);
      if (result) {
        albumsLoaded++;
        vinylsLoaded += result.vinylCount;
        album.status = 'loaded';
      }
    } catch (e) {
      errors++;
      console.log(`\n   ⚠️ ${(e as Error).message}`);
    }

    if (processed % 20 === 0) {
      recalculateStats(state);
      savePipelineState(filename, state);
    }

    await sleep(50);
  }

  state.phase = 'complete';
  recalculateStats(state);
  savePipelineState(filename, state);

  console.log('\n');
  console.log(`   ✅ Chargement terminé`);
  console.log(`      Albums: ${albumsLoaded}`);
  console.log(`      Vinyles: ${vinylsLoaded}`);
  if (errors) console.log(`      Erreurs: ${errors}`);

  printPipelineStats(state);

  console.log('\n✨ Pipeline terminé!');
}

main().catch(e => { console.error('\n💥', e); process.exit(1); });
