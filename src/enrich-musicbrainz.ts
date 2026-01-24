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

  const countries = args.countries
    ? (args.countries as string).split(',')
    : config.vinyl.defaultCountries;

  console.log(`   ${state.albums.length} albums à enrichir`);
  console.log(`   Pays: ${countries.join(', ')}\n`);

  const toProcess = state.albums.filter(a => a.status === 'extracted' || !a.musicbrainz);

  let processed = 0;
  let withMB = 0;
  let withVinyls = 0;

  for (const album of toProcess) {
    processed++;
    const artist = album.spotify.artist.split(',')[0].trim();
    const title = album.spotify.title;

    process.stdout.write(`\r   [${processed}/${toProcess.length}] ${artist} - ${title.substring(0, 25).padEnd(25)}`);

    try {
      const result = await searchAlbumVinyls(artist, title, countries);

      if (result.releaseGroup) {
        album.musicbrainz = {
          release_group_id: result.releaseGroup.id,
          release_group_title: result.releaseGroup.title,
        };
        withMB++;

        if (result.vinyls.length > 0) {
          album.vinyls = result.vinyls;
          album.status = 'enriched_mb';
          withVinyls++;
        } else {
          album.status = 'skipped';
          album.skip_reason = 'no_vinyls';
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
  console.log(`      Avec vinyles: ${withVinyls}`);
  console.log(`      Total vinyles: ${state.stats.total_vinyls}`);

  printPipelineStats(state);

  console.log('\n✨ Terminé!');
  console.log('   Prochaine étape: npm run enrich:covers -- --latest');
}

main().catch(e => { console.error('\n💥', e); process.exit(1); });
