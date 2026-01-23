/**
 * Gestion de la progression et de la reprise des scripts
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../../config/settings';

export interface ProgressState {
  scriptName: string;
  startedAt: string;
  lastUpdatedAt: string;
  phase: string;
  currentIndex: number;
  totalItems: number;
  processedItems: string[]; // IDs déjà traités
  stats: {
    success: number;
    skipped: number;
    errors: number;
  };
}

export interface ErrorEntry {
  timestamp: string;
  scriptName: string;
  phase: string;
  itemId: string;
  itemName: string;
  error: string;
  stack?: string;
}

/**
 * Charge l'état de progression depuis le fichier
 */
export function loadProgress(scriptName: string): ProgressState | null {
  try {
    if (!existsSync(config.paths.progressFile)) {
      return null;
    }
    const data = JSON.parse(readFileSync(config.paths.progressFile, 'utf-8'));
    // Vérifier que c'est bien le même script
    if (data.scriptName === scriptName) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sauvegarde l'état de progression
 */
export function saveProgress(state: ProgressState): void {
  ensureDataDir();
  state.lastUpdatedAt = new Date().toISOString();
  writeFileSync(config.paths.progressFile, JSON.stringify(state, null, 2));
}

/**
 * Crée un nouvel état de progression
 */
export function createProgress(
  scriptName: string,
  phase: string,
  totalItems: number
): ProgressState {
  return {
    scriptName,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    phase,
    currentIndex: 0,
    totalItems,
    processedItems: [],
    stats: {
      success: 0,
      skipped: 0,
      errors: 0,
    },
  };
}

/**
 * Efface la progression (pour recommencer à zéro)
 */
export function clearProgress(): void {
  if (existsSync(config.paths.progressFile)) {
    writeFileSync(config.paths.progressFile, '{}');
  }
}

/**
 * Vérifie si un item a déjà été traité
 */
export function isProcessed(state: ProgressState, itemId: string): boolean {
  return state.processedItems.includes(itemId);
}

/**
 * Marque un item comme traité
 */
export function markProcessed(
  state: ProgressState,
  itemId: string,
  status: 'success' | 'skipped' | 'error'
): void {
  if (!state.processedItems.includes(itemId)) {
    state.processedItems.push(itemId);
  }
  state.stats[status]++;
  state.currentIndex++;
}

/**
 * Log une erreur
 */
export function logError(
  scriptName: string,
  phase: string,
  itemId: string,
  itemName: string,
  error: Error | string
): void {
  ensureDataDir();

  const entry: ErrorEntry = {
    timestamp: new Date().toISOString(),
    scriptName,
    phase,
    itemId,
    itemName,
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
  };

  let errors: ErrorEntry[] = [];

  try {
    if (existsSync(config.paths.errorsFile)) {
      errors = JSON.parse(readFileSync(config.paths.errorsFile, 'utf-8'));
    }
  } catch {
    errors = [];
  }

  errors.push(entry);

  // Garder seulement les 1000 dernières erreurs
  if (errors.length > 1000) {
    errors = errors.slice(-1000);
  }

  writeFileSync(config.paths.errorsFile, JSON.stringify(errors, null, 2));
}

/**
 * Affiche un résumé de la progression
 */
export function printProgressSummary(state: ProgressState): void {
  const elapsed = Date.now() - new Date(state.startedAt).getTime();
  const elapsedMinutes = Math.round(elapsed / 60000);

  console.log('\n📊 Résumé:');
  console.log(`   Phase: ${state.phase}`);
  console.log(`   Progression: ${state.currentIndex}/${state.totalItems}`);
  console.log(`   ✅ Succès: ${state.stats.success}`);
  console.log(`   ⏭️  Ignorés: ${state.stats.skipped}`);
  console.log(`   ❌ Erreurs: ${state.stats.errors}`);
  console.log(`   ⏱️  Durée: ${elapsedMinutes} minutes`);

  if (state.currentIndex > 0) {
    const avgTime = elapsed / state.currentIndex;
    const remaining = (state.totalItems - state.currentIndex) * avgTime;
    const remainingMinutes = Math.round(remaining / 60000);
    console.log(`   ⏳ Temps restant estimé: ${remainingMinutes} minutes`);
  }
}

/**
 * Helper pour s'assurer que le dossier data existe
 */
function ensureDataDir(): void {
  const dir = dirname(config.paths.progressFile);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Wrapper pour exécuter une fonction avec gestion des interruptions
 */
export async function runWithProgress<T>(
  scriptName: string,
  items: T[],
  phase: string,
  getItemId: (item: T) => string,
  processItem: (item: T, index: number) => Promise<'success' | 'skipped' | 'error'>
): Promise<ProgressState> {
  // Charger ou créer la progression
  let state = loadProgress(scriptName);

  if (state && state.phase === phase) {
    console.log(`\n🔄 Reprise de la progression (${state.currentIndex}/${state.totalItems})`);
  } else {
    state = createProgress(scriptName, phase, items.length);
    console.log(`\n🚀 Démarrage: ${items.length} items à traiter`);
  }

  // Gestionnaire d'interruption
  let interrupted = false;
  const handleInterrupt = () => {
    console.log('\n\n⚠️  Interruption détectée, sauvegarde en cours...');
    interrupted = true;
  };
  process.on('SIGINT', handleInterrupt);
  process.on('SIGTERM', handleInterrupt);

  try {
    for (let i = state.currentIndex; i < items.length; i++) {
      if (interrupted) break;

      const item = items[i];
      const itemId = getItemId(item);

      // Skip si déjà traité
      if (isProcessed(state, itemId)) {
        continue;
      }

      try {
        const result = await processItem(item, i);
        markProcessed(state, itemId, result);
      } catch (error) {
        logError(scriptName, phase, itemId, String(item), error as Error);
        markProcessed(state, itemId, 'error');
        console.error(`   ❌ Erreur: ${(error as Error).message}`);
      }

      // Sauvegarder toutes les 10 itérations
      if (i % 10 === 0) {
        saveProgress(state);
      }
    }
  } finally {
    // Sauvegarde finale
    saveProgress(state);
    process.off('SIGINT', handleInterrupt);
    process.off('SIGTERM', handleInterrupt);
  }

  printProgressSummary(state);

  if (interrupted) {
    console.log('\n💾 Progression sauvegardée. Relancez le script pour reprendre.');
    process.exit(0);
  }

  return state;
}
