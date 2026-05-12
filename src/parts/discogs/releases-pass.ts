/**
 * Phase 2b — stream the Discogs releases dump, filter, normalize and
 * write to `stage-01-discogs-releases.jsonl`.
 *
 * Crash recovery: a checkpoint is saved every CHECKPOINT_EVERY releases.
 * Re-launching with the same checkpoint will skip releases until the
 * previously processed count is reached, then resume appending.
 *
 * Rejection counters are logged at the end so we can right-size the
 * filters.
 */
import { createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Stage01DiscogsReleaseSchema } from '../../config/schemas.js';
import {
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
} from '../../shared/checkpoint.js';
import { logger } from '../../shared/logger.js';
import { decideRelease, type RejectionReason } from './filters.js';
import { normalizeDiscogsRelease } from './normalize.js';
import { iterDiscogsReleases } from './sax-stream.js';

const CHECKPOINT_KEY = 'part-02-releases';
const CHECKPOINT_EVERY = 50_000; // releases processed between checkpoints
const PROGRESS_EVERY = 100_000;

interface ReleasesPassOptions {
  releasesGzPath: string;
  outputPath: string;
  priorityLabelIds: ReadonlySet<string>;
  /** If true, ignore checkpoint and start fresh (truncates output file). */
  fresh: boolean;
  /** If set, stop after this many releases have been processed (dev). */
  limit?: number;
}

interface PassStats {
  processed: number;
  accepted: number;
  rejections: Record<RejectionReason, number>;
}

interface ReleasesCheckpointCursor {
  /** How many <release> elements we have already scanned (kept or rejected). */
  processedAtSave: number;
  /** ID of the last release that was *kept* (for human-friendly inspection). */
  lastAcceptedReleaseId: string | null;
}

export async function runReleasesPass(
  opts: ReleasesPassOptions,
): Promise<PassStats> {
  const log = logger.child({ phase: '2b-releases' });

  // -- Resume or start fresh -----------------------------------
  let skipUntilProcessed = 0;
  let initialAccepted = 0;

  if (opts.fresh) {
    await clearCheckpoint(CHECKPOINT_KEY);
    try {
      await unlink(opts.outputPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
    log.info('starting fresh: checkpoint and output file cleared');
  } else {
    const cp = await loadCheckpoint(CHECKPOINT_KEY);
    const outputExists = await fileExists(opts.outputPath);
    if (cp && outputExists) {
      const cursor = cp.cursor as ReleasesCheckpointCursor;
      skipUntilProcessed = cursor.processedAtSave;
      initialAccepted = cp.processedCount; // we (ab)use processedCount as accepted count, see save()
      log.info(
        {
          skipUntilProcessed,
          previouslyAccepted: initialAccepted,
          lastAcceptedReleaseId: cursor.lastAcceptedReleaseId,
        },
        'resuming from checkpoint',
      );
    } else if (cp && !outputExists) {
      log.warn(
        'checkpoint exists but output file is missing — clearing checkpoint and starting fresh',
      );
      await clearCheckpoint(CHECKPOINT_KEY);
    } else if (!cp && outputExists) {
      log.warn(
        'output file exists but no checkpoint — starting fresh (file will be overwritten)',
      );
      await unlink(opts.outputPath);
    }
  }

  await mkdir(dirname(opts.outputPath), { recursive: true });
  const writeStream = createWriteStream(opts.outputPath, {
    encoding: 'utf-8',
    flags: 'a', // append: harmless on fresh start (file already deleted)
  });

  // -- Counters ------------------------------------------------
  const stats: PassStats = {
    processed: 0,
    accepted: initialAccepted,
    rejections: emptyRejections(),
  };
  let lastAcceptedReleaseId: string | null = null;
  let scanned = 0; // <release> elements seen this run

  // Helper for backpressure-aware writes ----------------------
  const writeLine = async (line: string): Promise<void> => {
    const ok = writeStream.write(line);
    if (!ok) {
      await new Promise<void>((resolve) =>
        writeStream.once('drain', () => resolve()),
      );
    }
  };

  try {
    for await (const raw of iterDiscogsReleases(opts.releasesGzPath)) {
      scanned += 1;

      // Skip until we catch up with the checkpoint
      if (scanned <= skipUntilProcessed) {
        if (scanned % PROGRESS_EVERY === 0) {
          log.info({ scanned, skipUntilProcessed }, 'skipping (resume)');
        }
        continue;
      }

      stats.processed += 1;

      const decision = decideRelease(raw, opts.priorityLabelIds);
      if (!decision.kept) {
        if (decision.rejection)
          stats.rejections[decision.rejection] =
            (stats.rejections[decision.rejection] ?? 0) + 1;
      } else {
        const normalized = normalizeDiscogsRelease(raw, decision.countryIso);
        const validated = Stage01DiscogsReleaseSchema.safeParse(normalized);
        if (!validated.success) {
          log.warn(
            {
              releaseId: raw.id,
              issues: validated.error.flatten(),
            },
            'normalized record failed validation — dropping',
          );
        } else {
          await writeLine(JSON.stringify(validated.data) + '\n');
          stats.accepted += 1;
          lastAcceptedReleaseId = raw.id;
        }
      }

      if (stats.processed % PROGRESS_EVERY === 0) {
        log.info(
          {
            scanned,
            accepted: stats.accepted,
            processedThisRun: stats.processed,
          },
          'progress',
        );
      }

      if (stats.processed % CHECKPOINT_EVERY === 0) {
        await saveCheckpoint(CHECKPOINT_KEY, {
          cursor: {
            processedAtSave: scanned,
            lastAcceptedReleaseId,
          } satisfies ReleasesCheckpointCursor,
          processedCount: stats.accepted,
        });
      }

      // No safety cap here — Part 2 is raw extraction. The real
      // filtering down to a Supabase-sized dataset happens in Part 4
      // (FR-artist cross-resolution via MusicBrainz) and Part 7 (load).
      // Use `--limit N` if you want to cap a dev run explicitly.

      if (opts.limit !== undefined && stats.processed >= opts.limit) {
        log.info({ limit: opts.limit }, 'limit reached — stopping');
        break;
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      writeStream.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
  }

  // Final checkpoint (allows a clean re-run to know we're done)
  await saveCheckpoint(CHECKPOINT_KEY, {
    cursor: {
      processedAtSave: scanned,
      lastAcceptedReleaseId,
    } satisfies ReleasesCheckpointCursor,
    processedCount: stats.accepted,
  });

  return stats;
}

// ============================================================
// Helpers
// ============================================================

function emptyRejections(): PassStats['rejections'] {
  return {
    not_accepted_status: 0,
    no_artist: 0,
    no_vinyl_format: 0,
    rejected_format_descriptor: 0,
    no_accepted_vinyl_descriptor: 0,
    rejected_flag: 0,
    country_not_in_scope: 0,
    no_labels_no_country: 0,
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
}