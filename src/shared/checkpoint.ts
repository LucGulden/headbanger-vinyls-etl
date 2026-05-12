/**
 * Lightweight checkpoint helper.
 *
 * A part can save() periodically to record progress (e.g., "processed
 * N records, last id = X"), and load() on startup to resume from where
 * it crashed instead of re-doing everything.
 *
 * Format: one JSON file per checkpoint key, under
 * `data/checkpoints/<key>.json`. Written atomically (write to .tmp +
 * rename) so an interrupted save can't leave a corrupted checkpoint.
 *
 * `cursor` is intentionally typed as `unknown` — each part decides what
 * shape its cursor takes (line number, Discogs release id, page number,
 * etc.) and casts on load.
 */
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { config } from '../config/index.js';

export interface CheckpointData {
  updatedAt: string;
  cursor: unknown;
  processedCount: number;
}

function pathFor(key: string): string {
  return join(config.paths.checkpoint, `${key}.json`);
}

export async function loadCheckpoint(
  key: string,
): Promise<CheckpointData | null> {
  try {
    const raw = await readFile(pathFor(key), 'utf-8');
    return JSON.parse(raw) as CheckpointData;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export async function saveCheckpoint(
  key: string,
  data: Omit<CheckpointData, 'updatedAt'>,
): Promise<void> {
  const filePath = pathFor(key);
  const tempPath = `${filePath}.tmp`;
  const payload: CheckpointData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
  await rename(tempPath, filePath);
}

export async function clearCheckpoint(key: string): Promise<void> {
  try {
    await unlink(pathFor(key));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}