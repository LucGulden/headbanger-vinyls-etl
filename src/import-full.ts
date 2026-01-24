/**
 * Pipeline complet: Extract → Enrich MB → Enrich Covers → Load
 *
 * Usage:
 *   npm run import:full -- --test
 *   npm run import:full -- --artists
 *   npm run import:full -- --extended
 *   npm run import:full -- --all
 *   npm run import:full -- --playlist=ID
 */

import { spawn } from 'child_process';

function runScript(script: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['tsx', script, ...args], {
      stdio: 'inherit',
      shell: true,
    });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
    proc.on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FillCrate - PIPELINE COMPLET');
  console.log('═══════════════════════════════════════════════════════════════');

  // Phase 1: Extract
  console.log('\n\n🔷 PHASE 1/4: EXTRACT (Spotify)\n');
  await runScript('src/extract-spotify.ts', args);

  // Phase 2: Enrich MB
  console.log('\n\n🔷 PHASE 2/4: ENRICH (MusicBrainz)\n');
  await runScript('src/enrich-musicbrainz.ts', ['--latest']);

  // Phase 3: Enrich Covers
  console.log('\n\n🔷 PHASE 3/4: ENRICH (Covers)\n');
  await runScript('src/enrich-covers.ts', ['--latest']);

  // Phase 4: Load
  console.log('\n\n🔷 PHASE 4/4: LOAD (Supabase)\n');
  await runScript('src/load-database.ts', ['--latest']);

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('   ✨ PIPELINE TERMINÉ!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(e => { console.error('\n💥', e); process.exit(1); });
