/**
 * Raw types representing what we extract from the Discogs XML dumps
 * BEFORE any filtering or normalization.
 *
 * These types are intentionally permissive — every field that the XML
 * may omit is typed as optional. The validation/normalization to the
 * Stage01 schema happens in `normalize.ts`.
 */

export interface RawDiscogsArtistRef {
  id: string;
  name: string;
  anv: string | null; // "artist name variation" — the credited name if different from `name`
  join: string | null; // join phrase (e.g. "feat.", "&")
  role: string | null;
}

export interface RawDiscogsLabelRef {
  id: string;
  name: string;
  catno: string | null;
}

export interface RawDiscogsFormat {
  name: string; // "Vinyl", "CD", "File", ...
  qty: string; // number of physical units
  text: string; // free-form (e.g. "180g", "Coloured")
  descriptions: string[]; // ["LP", "Album", "Reissue", ...]
}

export interface RawDiscogsTrack {
  position: string; // "A1", "B2", "1", "1-1", ...
  title: string;
  duration: string; // "5:20", "1:23:45", "" (empty)
}

export interface RawDiscogsIdentifier {
  type: string; // "Barcode", "Matrix / Runout", "ASIN", ...
  value: string;
  description: string | null;
}

export interface RawDiscogsRelease {
  id: string;
  status: string; // "Accepted", "Draft", "Submitted for Voting"
  title: string;
  artists: RawDiscogsArtistRef[];
  extraArtists: RawDiscogsArtistRef[]; // credits / contributors
  labels: RawDiscogsLabelRef[];
  formats: RawDiscogsFormat[];
  genres: string[];
  styles: string[];
  country: string | null;
  released: string | null; // ISO partial date "YYYY", "YYYY-MM-DD"
  notes: string | null;
  dataQuality: string | null; // "Correct", "Needs Vote", ...
  masterId: string | null;
  tracklist: RawDiscogsTrack[];
  identifiers: RawDiscogsIdentifier[];
}

export interface RawDiscogsLabel {
  id: string;
  name: string;
  contactInfo: string | null;
  profile: string | null;
  parentLabel: {
    id: string;
    name: string;
  } | null;
  sublabels: Array<{
    id: string;
    name: string;
  }>;
  dataQuality: string | null;
}