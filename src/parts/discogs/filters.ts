/**
 * Hard filters applied to each raw Discogs release.
 *
 * A release is kept by phase 2b only if `decideRelease()` returns
 * `{ kept: true }`. The decision returns a reason on rejection so we
 * can produce useful stats at the end of the run.
 */
import {
  ACCEPTED_REGION_FALLBACKS,
  ACCEPTED_VINYL_FORMAT_DESCRIPTORS,
  DISCOGS_COUNTRY_TO_ISO,
  PRESSING_COUNTRIES_PRIORITY,
  REJECTED_DISCOGS_FLAGS,
  REJECTED_FORMAT_DESCRIPTORS,
} from '../../config/scope.js';
import type { RawDiscogsRelease } from './types.js';

export type RejectionReason =
  | 'not_accepted_status'
  | 'no_artist'
  | 'no_vinyl_format'
  | 'rejected_format_descriptor'
  | 'no_accepted_vinyl_descriptor'
  | 'rejected_flag'
  | 'country_not_in_scope'
  | 'no_labels_no_country';

export interface ReleaseDecision {
  kept: boolean;
  rejection?: RejectionReason;
  /** Normalised ISO country (if resolvable). */
  countryIso: string | null;
  /** Whether the release belongs to a French priority label. */
  isPriorityLabel: boolean;
}

const ACCEPTED_COUNTRY_SET = new Set<string>([
  ...PRESSING_COUNTRIES_PRIORITY,
  ...ACCEPTED_REGION_FALLBACKS,
]);

const ACCEPTED_VINYL_DESCRIPTOR_SET = new Set(
  ACCEPTED_VINYL_FORMAT_DESCRIPTORS.map((s) => s.toLowerCase()),
);
const REJECTED_FORMAT_DESCRIPTOR_SET = new Set(
  REJECTED_FORMAT_DESCRIPTORS.map((s) => s.toLowerCase()),
);
const REJECTED_FLAG_SET = new Set(
  REJECTED_DISCOGS_FLAGS.map((s) => s.toLowerCase()),
);

export function decideRelease(
  release: RawDiscogsRelease,
  priorityLabelIds: ReadonlySet<string>,
): ReleaseDecision {
  // 1) Only accepted releases (no drafts, no pending votes) ----
  // The dump uses "accepted" / "rejected" / "deleted" / "draft" (lowercase
  // since at least 2017, though older docs and the very first releases may
  // show "Accepted" with a capital A). We compare case-insensitively, and
  // tolerate a missing status (treated as accepted) since some entries
  // produced by older importers omit the attribute entirely.
  const status = release.status.toLowerCase();
  if (status !== '' && status !== 'accepted') {
    return mk(false, 'not_accepted_status', null, false);
  }

  // 2) Must credit at least one artist --------------------------
  if (release.artists.length === 0) {
    return mk(false, 'no_artist', null, false);
  }

  // 3) Format analysis ------------------------------------------
  // Discogs releases can list several format entries (e.g. a vinyl +
  // CD boxset). We accept the release if AT LEAST one entry is Vinyl
  // and NO entry has a rejected descriptor.
  let hasVinylFormat = false;
  let hasAcceptedVinylDescriptor = false;

  for (const format of release.formats) {
    const isVinyl = format.name.toLowerCase() === 'vinyl';
    if (isVinyl) hasVinylFormat = true;

    for (const descRaw of format.descriptions) {
      const desc = descRaw.toLowerCase();
      if (REJECTED_FORMAT_DESCRIPTOR_SET.has(desc)) {
        return mk(false, 'rejected_format_descriptor', null, false);
      }
      if (REJECTED_FLAG_SET.has(desc)) {
        return mk(false, 'rejected_flag', null, false);
      }
      if (isVinyl && ACCEPTED_VINYL_DESCRIPTOR_SET.has(desc)) {
        hasAcceptedVinylDescriptor = true;
      }
    }

    // Some releases also use the format.name itself (e.g. "CD")
    if (REJECTED_FORMAT_DESCRIPTOR_SET.has(format.name.toLowerCase())) {
      return mk(false, 'rejected_format_descriptor', null, false);
    }
  }

  if (!hasVinylFormat) return mk(false, 'no_vinyl_format', null, false);
  if (!hasAcceptedVinylDescriptor)
    return mk(false, 'no_accepted_vinyl_descriptor', null, false);

  // 4) Resolve country to ISO -----------------------------------
  const countryIso = resolveCountryIso(release.country);

  // 5) Geography / label gate -----------------------------------
  const isPriorityLabel = release.labels.some((l) =>
    priorityLabelIds.has(l.id),
  );

  if (isPriorityLabel) {
    return mk(true, undefined, countryIso, true);
  }

  if (countryIso && ACCEPTED_COUNTRY_SET.has(countryIso)) {
    return mk(true, undefined, countryIso, false);
  }

  if (release.country) {
    return mk(false, 'country_not_in_scope', countryIso, false);
  }

  return mk(false, 'no_labels_no_country', null, false);
}

function mk(
  kept: boolean,
  rejection: RejectionReason | undefined,
  countryIso: string | null,
  isPriorityLabel: boolean,
): ReleaseDecision {
  return { kept, rejection, countryIso, isPriorityLabel };
}

function resolveCountryIso(country: string | null): string | null {
  if (!country) return null;
  const direct = DISCOGS_COUNTRY_TO_ISO[country];
  if (direct) return direct;
  // Already an ISO code? Discogs occasionally uses "UK" and "US"
  // directly. Treat any 2-letter uppercase token as ISO.
  if (/^[A-Z]{2}$/.test(country)) return country;
  return null;
}