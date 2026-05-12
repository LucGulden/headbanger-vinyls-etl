/**
 * Convert a raw Discogs release (post-filter) into the canonical
 * Stage01DiscogsRelease shape required by the next pipeline stage.
 *
 * This module is the place where messy free-form Discogs fields get
 * tightened up:
 *   - "released" dates parsed into a 4-digit year (or null)
 *   - "duration" strings like "5:20" parsed into seconds
 *   - "position" strings like "A1" / "B2" split into side + position
 *   - format descriptors reduced to one canonical token
 *   - "Notes" containing references to colour/weight extracted heuristically
 *
 * No external lookups happen here — this is a pure function over the
 * raw release.
 */
import type { Stage01DiscogsRelease } from '../../config/schemas.js';
import type {
  RawDiscogsArtistRef,
  RawDiscogsRelease,
  RawDiscogsTrack,
} from './types.js';

// Priority order for normalised vinyl format string.
// Earlier entries win when multiple descriptors are present.
const FORMAT_PRIORITY: ReadonlyArray<{ canonical: string; matches: string[] }> = [
  { canonical: 'Picture Disc', matches: ['picture disc'] },
  { canonical: 'LP', matches: ['lp'] },
  { canonical: 'EP', matches: ['ep'] },
  { canonical: '12"', matches: ['12"'] },
  { canonical: '10"', matches: ['10"'] },
  { canonical: '7"', matches: ['7"'] },
  { canonical: 'Maxi-Single', matches: ['maxi-single'] },
  { canonical: 'Mini-Album', matches: ['mini-album'] },
  { canonical: 'Album', matches: ['album'] },
  { canonical: 'Single', matches: ['single'] },
];

export function normalizeDiscogsRelease(
  raw: RawDiscogsRelease,
  countryIso: string | null,
): Stage01DiscogsRelease {
  const releaseYear = parseYear(raw.released);
  const format = pickCanonicalFormat(raw);
  const isReissue = hasDescriptor(raw, 'reissue') || hasDescriptor(raw, 're-issue');
  const isRemastered = hasDescriptor(raw, 'remastered');

  // Combine main artists + extraArtists. Main artists get role=null
  // (or "primary" if you prefer), extraArtists keep their role string.
  const artists = [
    ...raw.artists.map((a) => mapArtistRef(a, 'primary')),
    // Note: extraArtists are credits (producer, mixer, etc.), not
    // performing artists. We currently drop them at Stage01 — the
    // canonical `credits` text field carries them as free text. If we
    // want them as structured rows later, we can flip this.
  ];

  const tracks = raw.tracklist
    .map(mapTrackToVinylTrack)
    .filter((t): t is NonNullable<typeof t> => t !== null);

  const { color, weightGrams } = parseFormatText(raw);
  const { barcode, matrixRunout } = parseIdentifiers(raw);

  const labels = raw.labels.map((l) => ({
    discogsLabelId: l.id,
    name: l.name,
    catalogNumber: l.catno,
  }));

  const credits = formatCreditsText(raw.extraArtists);

  // Cross-references: scan Discogs URL identifiers / notes for an MBID.
  // We don't have a dedicated URLs field in our raw type, so leave nulls.
  // Phase 4 will do the cross-resolution properly via MusicBrainz dump.

  return {
    source: 'discogs',
    discogsReleaseId: raw.id,
    discogsMasterId: raw.masterId,
    title: raw.title,
    artists,
    releaseYear,
    country: countryIso,
    labels,
    formats: raw.formats.flatMap((f) => [f.name, ...f.descriptions]),
    format,
    isReissue,
    isRemastered,
    weightGrams,
    color,
    matrixRunout,
    barcode,
    tracks,
    notes: raw.notes,
    credits,
    genres: raw.genres,
    styles: raw.styles,
    musicbrainzReleaseId: null,
    musicbrainzReleaseGroupId: null,
  };
}

// ============================================================
// Helpers
// ============================================================

function mapArtistRef(
  a: RawDiscogsArtistRef,
  role: string | null,
): { discogsArtistId: string; name: string; role: string | null } {
  // anv = "artist name variation" — if present, it's the credited form
  // for this release. Prefer it over `name` for display purposes; we
  // keep the canonical name lookup via discogsArtistId.
  const credited = a.anv && a.anv.length > 0 ? a.anv : a.name;
  return {
    discogsArtistId: a.id,
    name: credited,
    role: a.role && a.role.length > 0 ? a.role : role,
  };
}

function parseYear(s: string | null): number | null {
  if (!s) return null;
  const m = /^(\d{4})/.exec(s);
  if (!m) return null;
  const y = Number.parseInt(m[1]!, 10);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  return y;
}

function pickCanonicalFormat(raw: RawDiscogsRelease): string | null {
  const allDescriptors = new Set<string>();
  for (const f of raw.formats) {
    for (const d of f.descriptions) allDescriptors.add(d.toLowerCase());
  }
  for (const entry of FORMAT_PRIORITY) {
    if (entry.matches.some((m) => allDescriptors.has(m))) return entry.canonical;
  }
  return null;
}

function hasDescriptor(raw: RawDiscogsRelease, descriptor: string): boolean {
  const target = descriptor.toLowerCase();
  for (const f of raw.formats) {
    for (const d of f.descriptions) {
      if (d.toLowerCase() === target) return true;
    }
  }
  return false;
}

/**
 * "5:20"     -> 320
 * "1:23:45"  -> 5025
 * ""         -> null
 * "5.20"     -> null (we don't try to be heroic)
 */
function parseDuration(s: string): number | null {
  if (!s) return null;
  const parts = s.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  let total = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    total = total * 60 + Number.parseInt(p, 10);
  }
  return total > 0 ? total : null;
}

/**
 * Discogs track positions look like "A1", "B2", "AA1", "1", "1-1".
 * We extract the leading alphabetic part as the vinyl side (A-Z) and
 * the trailing digits as the position. If the position has no letter
 * prefix (e.g. CD-style "1", "1-1"), we drop the track at Stage01: the
 * release is a vinyl, so a numeric-only position usually means the
 * Discogs entry mixes CD and vinyl tracklist data we can't trust.
 */
function mapTrackToVinylTrack(t: RawDiscogsTrack): {
  side: string;
  position: number;
  title: string;
  durationSeconds: number | null;
} | null {
  const m = /^([A-Z]+)(\d+)$/i.exec(t.position.trim());
  if (!m) return null;

  // For double / triple LPs, side can be AA, BB, ... or C, D, ...
  // Stage01 schema enforces a single letter A-Z. Map AA → A, BB → B
  // for our purposes (record number is implicit in track order).
  const sideRaw = m[1]!.toUpperCase();
  const side = sideRaw[0] ?? '';
  if (!/^[A-Z]$/.test(side)) return null;

  const position = Number.parseInt(m[2]!, 10);
  if (!Number.isFinite(position) || position <= 0) return null;

  const title = t.title.trim();
  if (!title) return null;

  return {
    side,
    position,
    title,
    durationSeconds: parseDuration(t.duration),
  };
}

/**
 * The free-text `format.text` field often holds the weight ("180g")
 * and/or color of the vinyl ("Yellow Translucent", "Red Vinyl"). We
 * pull out what we can with simple heuristics and leave the rest to
 * the user to inspect via raw notes.
 */
function parseFormatText(raw: RawDiscogsRelease): {
  color: string | null;
  weightGrams: number | null;
} {
  let color: string | null = null;
  let weightGrams: number | null = null;
  for (const f of raw.formats) {
    if (!f.text) continue;
    const text = f.text;

    // Weight: "180 g", "180g", "180 gram", "180 grams"
    const w = /(\d{2,4})\s*g(?:ram)?s?\b/i.exec(text);
    if (w && !weightGrams) {
      const n = Number.parseInt(w[1]!, 10);
      if (n > 50 && n < 500) weightGrams = n;
    }

    // Color: anything before the weight or a non-empty residue
    const withoutWeight = text.replace(/\b\d{2,4}\s*g(?:ram)?s?\b/i, '').trim();
    if (withoutWeight && !color) {
      color = withoutWeight.replace(/[,;]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (color.length === 0) color = null;
    }
  }
  return { color, weightGrams };
}

function parseIdentifiers(raw: RawDiscogsRelease): {
  barcode: string | null;
  matrixRunout: string | null;
} {
  let barcode: string | null = null;
  let matrixRunout: string | null = null;
  for (const id of raw.identifiers) {
    const type = id.type.toLowerCase();
    if (type === 'barcode' && !barcode) barcode = id.value || null;
    if (type === 'matrix / runout' && !matrixRunout) {
      // Discogs often has multiple matrix entries (one per side).
      // Keep the first; full list ends up in `credits`/notes if needed.
      matrixRunout = id.value || null;
    }
  }
  return { barcode, matrixRunout };
}

function formatCreditsText(extraArtists: RawDiscogsArtistRef[]): string | null {
  if (extraArtists.length === 0) return null;
  const lines = extraArtists
    .filter((a) => a.name)
    .map((a) => {
      const role = a.role && a.role.length > 0 ? a.role : 'Credit';
      return `${role}: ${a.name}`;
    });
  if (lines.length === 0) return null;
  return lines.join('\n');
}