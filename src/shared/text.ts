/**
 * Text normalization helpers, used mainly for label / artist name
 * matching against the curated FRENCH_PRIORITY_LABELS list.
 *
 * Pure functions, no I/O. Safe to use anywhere.
 */

/**
 * Strip combining diacritical marks via NFD normalization, so that
 * "Pathé Marconi" and "pathe marconi" compare equal.
 */
export function removeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Lowercase + remove accents + collapse internal whitespace and
 * non-alphanumerics into single spaces, then trim. Designed for
 * fuzzy equality on names, NOT for slug generation.
 *
 * "Pathé Marconi — La Voix De Son Maître"
 *   -> "pathe marconi la voix de son maitre"
 */
export function normalizeForMatching(s: string): string {
  return removeAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns true if `text` contains `target` as a whole "word run",
 * after both have been normalized for matching. Uses a regex with
 * word boundaries so that "trema" doesn't match inside "tremalium".
 *
 * Example:
 *   containsAsPhrase("pathe marconi emi", "pathe marconi") -> true
 *   containsAsPhrase("tremalium", "trema")                  -> false
 *   containsAsPhrase("trema", "trema")                       -> true
 *   containsAsPhrase("disques vogue", "vogue")               -> true
 */
export function containsAsPhrase(text: string, target: string): boolean {
  const normText = normalizeForMatching(text);
  const normTarget = normalizeForMatching(target);
  if (normTarget.length === 0) return false;

  // Escape regex special chars in target.
  const escaped = normTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // \b word boundaries, on the normalized (already alphanumeric+spaces) text.
  const re = new RegExp(`\\b${escaped}\\b`);
  return re.test(normText);
}

/**
 * Returns true if `name` matches at least one candidate from the list,
 * using `containsAsPhrase`. Used to test a Discogs label name against
 * FRENCH_PRIORITY_LABELS.
 */
export function matchesAnyCandidate(
  name: string,
  candidates: readonly string[],
): boolean {
  for (const candidate of candidates) {
    if (containsAsPhrase(name, candidate)) return true;
  }
  return false;
}