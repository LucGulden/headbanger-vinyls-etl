/**
 * Scope of the import — what enters the catalogue and what doesn't.
 *
 * Editing this file changes the filter criteria across the whole pipeline.
 * No part should hard-code scope decisions outside of here.
 *
 * MVP target audience: French users.
 * Phase 2 (later): expand internationally, starting with US.
 */

// ============================================================
// Geography
// ============================================================

/**
 * ISO 3166-1 alpha-2 country codes for vinyl pressings we accept,
 * ordered by priority. Used when several pressings exist for the same
 * album: the earliest one in this list wins as the "canonical" pressing.
 */
export const PRESSING_COUNTRIES_PRIORITY = [
  'FR', // France — top priority
  'BE', // Belgium
  'CH', // Switzerland (French part)
  'UK', // United Kingdom
  'DE', // Germany
  'IT', // Italy
  'ES', // Spain
  'NL', // Netherlands
  'US', // United States
] as const;

/**
 * Synthetic codes accepted when a pressing has no specific country
 * (Discogs uses "Europe", "Worldwide", etc.). We map them to these
 * buckets and accept them.
 */
export const ACCEPTED_REGION_FALLBACKS = ['EU', 'XW'] as const;

/**
 * Mapping from Discogs free-text country names to ISO codes.
 * MusicBrainz already uses ISO codes — no mapping needed there.
 */
export const DISCOGS_COUNTRY_TO_ISO: Readonly<Record<string, string>> = {
  France: 'FR',
  Belgium: 'BE',
  Switzerland: 'CH',
  UK: 'UK',
  'United Kingdom': 'UK',
  Germany: 'DE',
  Italy: 'IT',
  Spain: 'ES',
  Netherlands: 'NL',
  US: 'US',
  USA: 'US',
  'United States': 'US',
  'United States of America': 'US',
  Europe: 'EU',
  'UK & Europe': 'EU',
  Worldwide: 'XW',
};

/**
 * MusicBrainz artist `country` values we treat as "French scope".
 * Includes mainland France and the Overseas France territories — Luc's
 * Réunionnaise heritage is part of the audience, so artists from RE,
 * MQ, GP, etc. count as French scope.
 */
export const FRENCH_SCOPE_COUNTRY_CODES = [
  'FR', // France
  'RE', // Réunion
  'MQ', // Martinique
  'GP', // Guadeloupe
  'GF', // French Guiana
  'YT', // Mayotte
  'NC', // New Caledonia
  'PF', // French Polynesia
] as const;

// ============================================================
// Formats
// ============================================================

/**
 * Vinyl formats we keep. Discogs writes formats as a list of strings
 * mixing the medium ("Vinyl") with descriptors ("LP", "33 ⅓ RPM",
 * "Album", "Reissue"). We accept a release if "Vinyl" appears AND one
 * of the size/length descriptors below appears.
 */
export const ACCEPTED_VINYL_FORMAT_DESCRIPTORS = [
  'LP',
  'EP',
  '7"',
  '10"',
  '12"',
  'Picture Disc',
  'Album',
  'Single',
  'Mini-Album',
  'Maxi-Single',
] as const;

/**
 * Format strings that, when present in a Discogs release, disqualify it
 * even if "Vinyl" is also listed (e.g., mixed-media boxsets we don't
 * want at the MVP stage).
 */
export const REJECTED_FORMAT_DESCRIPTORS = [
  'CD',
  'CDr',
  'Cassette',
  'DVD',
  'Blu-ray',
  'File', // = digital release
] as const;

/**
 * Discogs release flags we reject outright.
 * "Promo" debatable; we drop them for MVP and can revisit.
 */
export const REJECTED_DISCOGS_FLAGS = [
  'Bootleg',
  'Unofficial Release',
  'Counterfeit',
  'Promo',
] as const;

// ============================================================
// French priority labels
// ============================================================

/**
 * Labels whose discography we want to import in full (vinyl-format
 * releases only). Grouped by era / genre for human readability — the
 * pipeline doesn't care about the order.
 *
 * Matching strategy in Part 2 / Part 3:
 *   1. Search Discogs / MusicBrainz by name to get the label's ID.
 *   2. Cache the resolved ID.
 *   3. Pull all releases tagged with that ID.
 *
 * Add or remove entries here, then re-run Part 2.
 */
export const FRENCH_PRIORITY_LABELS = [
  // --- Chanson française / variété — catalogues historiques ---
  'Pathé Marconi',
  'Pathé',
  'Polydor France',
  'Barclay',
  'Philips France',
  'Disques Vogue',
  'Vogue',
  'RCA Victor France',
  'Disques Festival',
  'Disques Vega',
  'Trema',
  'BAM',

  // --- Variété / pop FR moderne ---
  'AB Disques',
  'Carrere',
  'EMI France',
  'Mercury France',
  'Polygram France',
  'Wagram Music',
  'Tôt ou Tard',
  'Naïve',

  // --- Rock / alternative / indé FR ---
  'Crash Disques',
  'Boucherie Productions',
  'Bondage Records',
  'Cinq 7',
  'Tricatel',
  'Pan European Recording',
  'Atmosphériques',
  'Animal 63',

  // --- Électro / house / French Touch ---
  'Ed Banger Records',
  'Roulé',
  'Crydamoure',
  'F Communications',
  'Versatile Records',
  'Because Music',
  'Kitsuné',
  'Pschent',
  'Tigersushi',
  'Yellow Productions',
  'Pias France',
  'Pias Recordings',

  // --- Hip-hop FR ---
  'Hostile Records',
  'Time Bomb',
  'Delabel',
  'Double H Productions',
  '45 Scientific',
  'Secteur Ä',

  // --- Jazz FR ---
  'Vogue Jazz Club',
  'BYG Records',
  'BYG Actuel',
  'Saravah',
  'OWL Records',
  'Label Bleu',
  'Sketch',
  'Dreyfus Jazz',

  // --- Reggae / world / outre-mer (Antilles, Réunion) ---
  'Makasound',
  'Cobalt',
  'Buda Musique',
  'Marabi',
  'Discograph',
  'Aztec Musique',
  'Hibiscus Records',
  'Piros',
  'Oasis Music',
  'Discorama',
  'Sakifo',

  // --- Classique / contemporain FR ---
  'Erato',
  'Harmonia Mundi France',
  'Cyprès',
  'Disques Adès',
  'Naïve Classique',
  'Astrée',
] as const;

// ============================================================
// International popular layer
// ============================================================

/**
 * Number of internationally-popular artists to include on top of the
 * French scope. Resolved against Spotify popularity index in Part 6.
 *
 * Resolution mechanism (decided in Part 6, noted here for context):
 *   - Start from a curated seed list (Wikipedia best-selling artists +
 *     Rolling Stone / NME canonical lists).
 *   - For each seed, call Spotify Search to get the artist's ID and
 *     popularity score (0–100).
 *   - Keep the top N by popularity score.
 *   - Pull their full discography from MusicBrainz / Discogs.
 */
export const INTERNATIONAL_TOP_N_ARTISTS = 500;

/**
 * Lower bound on Spotify popularity (0–100) below which an internationally
 * popular candidate is dropped. Stops obscure entries from sneaking in.
 */
export const INTERNATIONAL_MIN_SPOTIFY_POPULARITY = 50;

// ============================================================
// Safety nets — hard limits on the total imported volume
// ============================================================

/**
 * Hard ceilings. Hitting any of these aborts the pipeline with a clear
 * error. Tweak after the first dry run to right-size against the actual
 * Supabase free-tier budget (~500 MB DB).
 */
export const SAFETY_LIMITS = {
  maxArtists: 20_000,
  maxAlbums: 80_000,
  maxVinyls: 200_000,
  maxTracks: 1_000_000,
} as const;

// ============================================================
// Discogs / MusicBrainz API rate limits
// ============================================================

/**
 * MusicBrainz: 1 req/sec hard cap on the public API.
 * Discogs:    60 req/min authenticated, 25 req/min anonymous.
 *
 * Used by Part 5 (cover fetching) and Part 6 (Spotify enrichment).
 */
export const API_RATE_LIMITS = {
  musicbrainzRequestsPerSecond: 1,
  discogsRequestsPerMinute: 55, // a hair below the cap, for safety margin
  spotifyRequestsPerSecond: 10,
} as const;