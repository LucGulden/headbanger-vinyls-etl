/**
 * Streaming XML parser for Discogs dumps.
 *
 * Discogs releases dump is ~80 GB uncompressed — we cannot load it. We
 * use SAX (event-based, low memory) and expose two async iterables:
 *
 *   - iterDiscogsReleases(gzPath) yields RawDiscogsRelease objects.
 *   - iterDiscogsLabels(gzPath)   yields RawDiscogsLabel objects.
 *
 * Internally, SAX events feed a stack-based builder. When the target
 * element closes, we push the built object into a bounded buffer and
 * pause the input stream if the consumer can't keep up. The buffer
 * drains as the consumer pulls items.
 */
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import sax from 'sax';
import type {
  RawDiscogsArtistRef,
  RawDiscogsFormat,
  RawDiscogsIdentifier,
  RawDiscogsLabel,
  RawDiscogsLabelRef,
  RawDiscogsRelease,
  RawDiscogsTrack,
} from './types.js';

// ============================================================
// Generic SAX driver — async iterable with backpressure
// ============================================================

interface SaxDriverOptions<T> {
  /** Path to the .xml.gz file on disk. */
  gzPath: string;
  /** Tag name that delimits one yielded item (e.g. 'release', 'label'). */
  itemTag: string;
  /** Maximum items buffered before pausing the input stream. */
  bufferSize?: number;
  /**
   * Called for each SAX event while we are inside an item.
   * The builder maintains its own state and returns a finished item
   * when the itemTag closes (or returns null to skip the item).
   */
  buildItem: () => ItemBuilder<T>;
}

/**
 * Per-item builder. We instantiate a fresh one each time we enter the
 * item tag and call `.finish()` when we leave it.
 */
interface ItemBuilder<T> {
  onOpenTag(name: string, attrs: Record<string, string>, path: string[]): void;
  onText(text: string, path: string[]): void;
  onCloseTag(name: string, path: string[]): void;
  finish(): T | null;
}

function streamXmlItems<T>(opts: SaxDriverOptions<T>): AsyncIterable<T> {
  const { gzPath, itemTag, buildItem } = opts;
  const bufferSize = opts.bufferSize ?? 200;

  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      // --- consumer-side state ---
      const queue: T[] = [];
      let waitingResolve: ((r: IteratorResult<T>) => void) | null = null;
      let finished = false;
      let streamError: Error | null = null;

      // --- producer-side state ---
      const fileStream = createReadStream(gzPath);
      const gunzip = createGunzip();
      const parser = sax.createStream(true, {
        trim: false,
        normalize: false,
      });

      const path: string[] = [];
      let depth = 0;
      let inItem = false;
      let builder: ItemBuilder<T> | null = null;

      // -- push helper, handles backpressure --
      const push = (item: T) => {
        if (waitingResolve) {
          const r = waitingResolve;
          waitingResolve = null;
          r({ value: item, done: false });
          return;
        }
        queue.push(item);
        if (queue.length >= bufferSize) {
          gunzip.pause();
          fileStream.pause();
        }
      };

      const fail = (err: Error) => {
        streamError = err;
        finished = true;
        if (waitingResolve) {
          const r = waitingResolve;
          waitingResolve = null;
          r({ value: undefined, done: true });
        }
      };

      // -- SAX wiring --
      parser.on('opentag', (node) => {
        const name = node.name; // strict=true → preserves case
        depth += 1;
        path.push(name);

        if (!inItem && name === itemTag && depth === 2) {
          // entering an item (top-level child of the root)
          inItem = true;
          builder = buildItem();
        }

        if (inItem && builder) {
          // Coerce attribute values to strings (sax types them as 'any' or 'string').
          const attrs: Record<string, string> = {};
          if (node.attributes) {
            for (const [k, v] of Object.entries(node.attributes)) {
              attrs[k] = typeof v === 'string' ? v : String(v);
            }
          }
          builder.onOpenTag(name, attrs, path);
        }
      });

      parser.on('text', (text) => {
        if (inItem && builder) builder.onText(text, path);
      });

      parser.on('cdata', (text) => {
        if (inItem && builder) builder.onText(text, path);
      });

      parser.on('closetag', (name) => {
        if (inItem && builder) builder.onCloseTag(name, path);

        if (inItem && name === itemTag && depth === 2) {
          const item = builder!.finish();
          if (item !== null) push(item);
          inItem = false;
          builder = null;
        }

        depth -= 1;
        path.pop();
      });

      parser.on('error', (err) => fail(err));
      parser.on('end', () => {
        finished = true;
        if (waitingResolve) {
          const r = waitingResolve;
          waitingResolve = null;
          r({ value: undefined, done: true });
        }
      });

      fileStream.on('error', (err) => fail(err));
      gunzip.on('error', (err) => fail(err));

      fileStream.pipe(gunzip).pipe(parser);

      // --- iterator ---
      return {
        async next(): Promise<IteratorResult<T>> {
          if (streamError) throw streamError;
          if (queue.length > 0) {
            const value = queue.shift() as T;
            // Resume if we're well below the buffer threshold.
            if (queue.length < bufferSize / 2 && gunzip.isPaused()) {
              gunzip.resume();
              fileStream.resume();
            }
            return { value, done: false };
          }
          if (finished) {
            return { value: undefined as never, done: true };
          }
          return new Promise<IteratorResult<T>>((resolve) => {
            waitingResolve = resolve;
          });
        },
        async return(): Promise<IteratorResult<T>> {
          fileStream.destroy();
          gunzip.destroy();
          parser.removeAllListeners();
          finished = true;
          return { value: undefined as never, done: true };
        },
      };
    },
  };
}

// ============================================================
// Release builder
// ============================================================

class ReleaseBuilder implements ItemBuilder<RawDiscogsRelease> {
  private id = '';
  private status = '';
  private title = '';
  private artists: RawDiscogsArtistRef[] = [];
  private extraArtists: RawDiscogsArtistRef[] = [];
  private labels: RawDiscogsLabelRef[] = [];
  private formats: RawDiscogsFormat[] = [];
  private genres: string[] = [];
  private styles: string[] = [];
  private country: string | null = null;
  private released: string | null = null;
  private notes: string | null = null;
  private dataQuality: string | null = null;
  private masterId: string | null = null;
  private tracklist: RawDiscogsTrack[] = [];
  private identifiers: RawDiscogsIdentifier[] = [];

  // --- transient builders ---
  private inArtists = false;
  private inExtraArtists = false;
  private currentArtist: Partial<RawDiscogsArtistRef> | null = null;
  private currentFormat: Partial<RawDiscogsFormat> | null = null;
  private inFormatDescriptions = false;
  private currentTrack: Partial<RawDiscogsTrack> | null = null;
  private inTracklist = false;
  private inSubTracks = false; // skip nested <sub_tracks>
  private textBuffer = '';

  onOpenTag(name: string, attrs: Record<string, string>, path: string[]): void {
    this.textBuffer = '';

    if (path.length === 2 && name === 'release') {
      this.id = attrs.id ?? '';
      this.status = attrs.status ?? '';
      return;
    }

    // Track context flags ----------------------------------
    // These flags only switch when we cross the release-level boundaries
    // for these blocks (depth-3 children of <release>). Discogs also nests
    // <artists> and <extraartists> inside individual <track> elements for
    // per-track credits — those must NOT pollute the release-level lists.
    if (name === 'artists' && path.length === 3) this.inArtists = true;
    else if (name === 'extraartists' && path.length === 3) this.inExtraArtists = true;
    else if (name === 'tracklist') this.inTracklist = true;
    else if (name === 'sub_tracks') this.inSubTracks = true;
    else if (name === 'descriptions') this.inFormatDescriptions = true;

    // Start an artist ref (inside artists or extraartists) -----
    if (name === 'artist' && (this.inArtists || this.inExtraArtists)) {
      this.currentArtist = { id: '', name: '', anv: null, join: null, role: null };
      return;
    }

    // Labels are self-closing tags with attributes -----------
    if (name === 'label' && this.parentIsLabels(path)) {
      this.labels.push({
        id: attrs.id ?? '',
        name: attrs.name ?? '',
        catno: attrs.catno || null,
      });
      return;
    }

    // Format ------------------------------------------------
    if (name === 'format' && this.parentIsFormats(path)) {
      this.currentFormat = {
        name: attrs.name ?? '',
        qty: attrs.qty ?? '',
        text: attrs.text ?? '',
        descriptions: [],
      };
      return;
    }

    // Master id has both attribute and text content ---------
    if (name === 'master_id') {
      // value is in text content; attributes hold is_main_release
      return;
    }

    // Track -------------------------------------------------
    if (name === 'track' && this.inTracklist && !this.inSubTracks) {
      this.currentTrack = { position: '', title: '', duration: '' };
      return;
    }

    // Identifier (self-closing) -----------------------------
    if (name === 'identifier' && this.parentIsIdentifiers(path)) {
      this.identifiers.push({
        type: attrs.type ?? '',
        value: attrs.value ?? '',
        description: attrs.description || null,
      });
      return;
    }
  }

  onText(text: string, _path: string[]): void {
    this.textBuffer += text;
  }

  onCloseTag(name: string, path: string[]): void {
    const text = this.textBuffer;

    // Reset context flags ----------------------------------
    if (name === 'artists' && path.length === 3) {
      this.inArtists = false;
    } else if (name === 'extraartists' && path.length === 3) {
      this.inExtraArtists = false;
    } else if (name === 'tracklist' && path.length === 3) {
      this.inTracklist = false;
    } else if (name === 'sub_tracks') {
      this.inSubTracks = false;
    } else if (name === 'descriptions') {
      this.inFormatDescriptions = false;
    }

    // Top-level scalar fields ------------------------------
    if (path.length === 3) {
      // child of <release>
      switch (name) {
        case 'title':
          this.title = text.trim();
          break;
        case 'country':
          this.country = text.trim() || null;
          break;
        case 'released':
          this.released = text.trim() || null;
          break;
        case 'notes':
          this.notes = text.trim() || null;
          break;
        case 'data_quality':
          this.dataQuality = text.trim() || null;
          break;
        case 'master_id':
          this.masterId = text.trim() || null;
          break;
        case 'genres':
        case 'styles':
        case 'artists':
        case 'extraartists':
        case 'labels':
        case 'formats':
        case 'tracklist':
        case 'identifiers':
        case 'images':
        case 'videos':
        case 'companies':
        case 'series':
          // containers; handled per-child
          break;
      }
    }

    // Artist members ---------------------------------------
    if (this.currentArtist) {
      switch (name) {
        case 'id':
          this.currentArtist.id = text.trim();
          break;
        case 'name':
          this.currentArtist.name = text.trim();
          break;
        case 'anv':
          this.currentArtist.anv = text.trim() || null;
          break;
        case 'join':
          this.currentArtist.join = text.trim() || null;
          break;
        case 'role':
          this.currentArtist.role = text.trim() || null;
          break;
        case 'artist':
          if (this.inArtists)
            this.artists.push(this.currentArtist as RawDiscogsArtistRef);
          else if (this.inExtraArtists)
            this.extraArtists.push(this.currentArtist as RawDiscogsArtistRef);
          this.currentArtist = null;
          break;
      }
    }

    // Format descriptions ----------------------------------
    if (this.inFormatDescriptions && name === 'description' && this.currentFormat) {
      this.currentFormat.descriptions!.push(text.trim());
    }
    if (name === 'format' && this.currentFormat) {
      this.formats.push(this.currentFormat as RawDiscogsFormat);
      this.currentFormat = null;
    }

    // Genres / styles --------------------------------------
    if (name === 'genre' && path.includes('genres')) {
      const t = text.trim();
      if (t) this.genres.push(t);
    }
    if (name === 'style' && path.includes('styles')) {
      const t = text.trim();
      if (t) this.styles.push(t);
    }

    // Tracks (top-level only, not sub_tracks) -------------
    if (this.currentTrack && !this.inSubTracks) {
      switch (name) {
        case 'position':
          this.currentTrack.position = text.trim();
          break;
        case 'title':
          if (path.length >= 4 && path[path.length - 2] === 'track') {
            this.currentTrack.title = text.trim();
          }
          break;
        case 'duration':
          this.currentTrack.duration = text.trim();
          break;
        case 'track':
          this.tracklist.push(this.currentTrack as RawDiscogsTrack);
          this.currentTrack = null;
          break;
      }
    }

    this.textBuffer = '';
  }

  finish(): RawDiscogsRelease | null {
    if (!this.id) return null;
    return {
      id: this.id,
      status: this.status,
      title: this.title,
      artists: this.artists,
      extraArtists: this.extraArtists,
      labels: this.labels,
      formats: this.formats,
      genres: this.genres,
      styles: this.styles,
      country: this.country,
      released: this.released,
      notes: this.notes,
      dataQuality: this.dataQuality,
      masterId: this.masterId,
      tracklist: this.tracklist,
      identifiers: this.identifiers,
    };
  }

  // --- path helpers ---
  private parentIsLabels(path: string[]): boolean {
    return path.length >= 4 && path[path.length - 2] === 'labels';
  }
  private parentIsFormats(path: string[]): boolean {
    return path.length >= 4 && path[path.length - 2] === 'formats';
  }
  private parentIsIdentifiers(path: string[]): boolean {
    return path.length >= 4 && path[path.length - 2] === 'identifiers';
  }
}

// ============================================================
// Label builder
// ============================================================

class LabelBuilder implements ItemBuilder<RawDiscogsLabel> {
  private id = '';
  private name = '';
  private contactInfo: string | null = null;
  private profile: string | null = null;
  private parentLabel: { id: string; name: string } | null = null;
  private sublabels: Array<{ id: string; name: string }> = [];
  private dataQuality: string | null = null;

  private textBuffer = '';
  private inParentLabel = false;
  private parentLabelAttrs: { id: string } | null = null;
  private inSublabels = false;
  private currentSublabel: { id: string; name: string } | null = null;

  onOpenTag(name: string, attrs: Record<string, string>, path: string[]): void {
    this.textBuffer = '';

    if (name === 'parentLabel') {
      this.inParentLabel = true;
      this.parentLabelAttrs = { id: attrs.id ?? '' };
    } else if (name === 'sublabels') {
      this.inSublabels = true;
    } else if (name === 'label' && this.inSublabels) {
      this.currentSublabel = { id: attrs.id ?? '', name: '' };
    }
  }

  onText(text: string, _path: string[]): void {
    this.textBuffer += text;
  }

  onCloseTag(name: string, path: string[]): void {
    const text = this.textBuffer;

    if (path.length === 3) {
      // child of <label> (the top-level one)
      switch (name) {
        case 'id':
          this.id = text.trim();
          break;
        case 'name':
          this.name = text.trim();
          break;
        case 'contactinfo':
          this.contactInfo = text.trim() || null;
          break;
        case 'profile':
          this.profile = text.trim() || null;
          break;
        case 'data_quality':
          this.dataQuality = text.trim() || null;
          break;
      }
    }

    if (name === 'parentLabel' && this.parentLabelAttrs) {
      this.parentLabel = {
        id: this.parentLabelAttrs.id,
        name: text.trim(),
      };
      this.inParentLabel = false;
      this.parentLabelAttrs = null;
    }

    if (name === 'label' && this.currentSublabel) {
      this.currentSublabel.name = text.trim();
      this.sublabels.push(this.currentSublabel);
      this.currentSublabel = null;
    }

    if (name === 'sublabels') {
      this.inSublabels = false;
    }

    this.textBuffer = '';
  }

  finish(): RawDiscogsLabel | null {
    if (!this.id) return null;
    return {
      id: this.id,
      name: this.name,
      contactInfo: this.contactInfo,
      profile: this.profile,
      parentLabel: this.parentLabel,
      sublabels: this.sublabels,
      dataQuality: this.dataQuality,
    };
  }
}

// ============================================================
// Public entry points
// ============================================================

export function iterDiscogsReleases(
  gzPath: string,
): AsyncIterable<RawDiscogsRelease> {
  return streamXmlItems({
    gzPath,
    itemTag: 'release',
    buildItem: () => new ReleaseBuilder(),
  });
}

export function iterDiscogsLabels(
  gzPath: string,
): AsyncIterable<RawDiscogsLabel> {
  return streamXmlItems({
    gzPath,
    itemTag: 'label',
    buildItem: () => new LabelBuilder(),
  });
}