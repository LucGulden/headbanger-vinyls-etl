/**
 * Part 2 — Discogs extract.
 *
 * Orchestrates two phases:
 *
 *   Phase 2a — read the labels dump, extract IDs of French priority
 *              labels (and their sublabels) into a JSON index.
 *
 *   Phase 2b — stream the releases dump, apply hard filters, normalise,
 *              write `stage-01-discogs-releases.jsonl`.
 *
 * Usage:
 *   pnpm part-02                 # full run, resume from checkpoint if any
 *   pnpm part-02 -- --fresh      # ignore checkpoint, start over
 *   pnpm part-02 -- --limit 50000   # stop after 50k releases (dev)
 *   pnpm part-02 -- --skip-labels   # reuse the existing priority-label-ids.json
 *
 * Inputs:  data/raw/discogs_YYYYMMDD_labels.xml.gz
 *          data/raw/discogs_YYYYMMDD_releases.xml.gz
 * Output:  data/stage/priority-label-ids.json
 *          data/stage/stage-01-discogs-releases.jsonl
 */
import { parseArgs } from 'node:util';
import { config } from '../config/index.js';
import { logger } from '../shared/logger.js';
import { PIPELINE_FILES, stagePath } from '../shared/paths.js';
import { discoverDiscogsDumps } from './discogs/discover.js';
import {
  extractPriorityLabelIds,
  loadPriorityLabelIndex,
} from './discogs/labels-pass.js';
import { runReleasesPass } from './discogs/releases-pass.js';

const PRIORITY_LABEL_INDEX_FILE = 'priority-label-ids.json';

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      fresh: { type: 'boolean', default: false },
      'skip-labels': { type: 'boolean', default: false },
      limit: { type: 'string' },
    },
    allowPositionals: false,
  });

  const log = logger.child({ part: '02' });
  log.info({ args: values, dataRoot: config.paths.dataRoot }, 'starting part 2');

  // --- locate dumps ------------------------------------------------
  const dumps = await discoverDiscogsDumps();
  log.info(
    {
      dumpDate: dumps.dumpDate,
      labels: dumps.labels,
      releases: dumps.releases,
    },
    'discovered dump files',
  );

  // --- phase 2a ----------------------------------------------------
  const indexPath = stagePath(PRIORITY_LABEL_INDEX_FILE);
  let priorityLabelIds: Set<string>;

  if (values['skip-labels']) {
    const existing = await loadPriorityLabelIndex(indexPath);
    if (!existing) {
      log.error(
        { path: indexPath },
        '--skip-labels requested but no priority-label-ids.json found; run without --skip-labels first',
      );
      process.exit(1);
    }
    if (existing.dumpDate !== dumps.dumpDate) {
      log.warn(
        { cached: existing.dumpDate, current: dumps.dumpDate },
        'priority-label-ids.json was built from a different dump month — consider re-running phase 2a',
      );
    }
    priorityLabelIds = new Set(existing.labelIds);
    log.info(
      { count: priorityLabelIds.size },
      'reused cached priority label index',
    );
  } else {
    const index = await extractPriorityLabelIds({
      labelsGzPath: dumps.labels,
      dumpDate: dumps.dumpDate,
      outputPath: indexPath,
    });
    priorityLabelIds = new Set(index.labelIds);
  }

  // --- phase 2b ----------------------------------------------------
  const limit = values.limit ? Number.parseInt(values.limit, 10) : undefined;
  if (values.limit !== undefined && (!Number.isFinite(limit) || (limit as number) <= 0)) {
    log.error({ limit: values.limit }, 'invalid --limit value');
    process.exit(1);
  }

  const stats = await runReleasesPass({
    releasesGzPath: dumps.releases,
    outputPath: stagePath(PIPELINE_FILES.stage01DiscogsReleases),
    priorityLabelIds,
    fresh: values.fresh,
    limit,
  });

  // --- summary -----------------------------------------------------
  log.info(
    {
      processed: stats.processed,
      accepted: stats.accepted,
      rejections: stats.rejections,
    },
    'part 2 complete',
  );
}

main().catch((err) => {
  logger.fatal({ err }, 'part 2 failed');
  process.exit(1);
});