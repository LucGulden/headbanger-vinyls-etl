/**
 * Phase 2a — Resolve French priority label IDs.
 *
 * Streams `discogs_*_labels.xml.gz` and extracts the Discogs label IDs
 * whose name (or parent label name) matches an entry in
 * `FRENCH_PRIORITY_LABELS`.
 *
 * Output: `data/stage/priority-label-ids.json` — a JSON file holding a
 * sorted, de-duplicated array of label IDs and a `matches` map for
 * debugging (which label name caused which IDs to be picked).
 *
 * Why a separate file? Phase 2b reads it as a Set and uses it as one of
 * the acceptance criteria for a release. Caching the pre-resolved IDs
 * means phase 2b doesn't carry a heavy label-name matcher in its hot
 * path.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  FRENCH_PRIORITY_LABELS,
} from '../../config/scope.js';
import { logger } from '../../shared/logger.js';
import { containsAsPhrase } from '../../shared/text.js';
import { iterDiscogsLabels } from './sax-stream.js';

export interface PriorityLabelsIndex {
  /** Dump date (YYYYMMDD) the IDs were extracted from. */
  dumpDate: string;
  /** Sorted list of unique Discogs label IDs to accept. */
  labelIds: string[];
  /**
   * Debug map: priority-label-name → list of Discogs labels that matched.
   * Helps inspect whether our matcher is too loose or too strict.
   */
  matches: Record<string, Array<{ id: string; name: string; reason: 'self' | 'parent' }>>;
}

export async function extractPriorityLabelIds(args: {
  labelsGzPath: string;
  dumpDate: string;
  outputPath: string;
}): Promise<PriorityLabelsIndex> {
  const log = logger.child({ phase: '2a-labels' });
  log.info(
    { labels: FRENCH_PRIORITY_LABELS.length, file: args.labelsGzPath },
    'Scanning Discogs labels dump for priority matches',
  );

  const matches: PriorityLabelsIndex['matches'] = {};
  const idSet = new Set<string>();

  let scanned = 0;
  let progressEvery = 50_000;

  for await (const label of iterDiscogsLabels(args.labelsGzPath)) {
    scanned += 1;

    // Skip degenerate entries (no name)
    if (!label.name) continue;

    // 1) match by own name
    for (const priority of FRENCH_PRIORITY_LABELS) {
      if (containsAsPhrase(label.name, priority)) {
        idSet.add(label.id);
        recordMatch(matches, priority, label.id, label.name, 'self');
        break; // one match per label entry is enough
      }
    }

    // 2) match by parent label name (a sublabel of a priority label)
    if (label.parentLabel && label.parentLabel.name) {
      for (const priority of FRENCH_PRIORITY_LABELS) {
        if (containsAsPhrase(label.parentLabel.name, priority)) {
          idSet.add(label.id);
          recordMatch(matches, priority, label.id, label.name, 'parent');
          break;
        }
      }
    }

    if (scanned % progressEvery === 0) {
      log.info(
        { scanned, matchedSoFar: idSet.size },
        'progress',
      );
    }
  }

  const ids = [...idSet].sort();
  log.info({ scanned, matched: ids.length }, 'phase 2a complete');

  const index: PriorityLabelsIndex = {
    dumpDate: args.dumpDate,
    labelIds: ids,
    matches,
  };

  await mkdir(dirname(args.outputPath), { recursive: true });
  await writeFile(args.outputPath, JSON.stringify(index, null, 2), 'utf-8');
  log.info({ path: args.outputPath, count: ids.length }, 'wrote priority label index');

  return index;
}

function recordMatch(
  matches: PriorityLabelsIndex['matches'],
  priority: string,
  id: string,
  name: string,
  reason: 'self' | 'parent',
): void {
  if (!matches[priority]) matches[priority] = [];
  matches[priority].push({ id, name, reason });
}

/**
 * Load a previously written priority-label index from disk.
 * Returns null if not present.
 */
export async function loadPriorityLabelIndex(
  path: string,
): Promise<PriorityLabelsIndex | null> {
  const { readFile } = await import('node:fs/promises');
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as PriorityLabelsIndex;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}