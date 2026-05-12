/**
 * Streaming JSONL read/write helpers.
 *
 * - readJsonl: yields one validated record per line; throws on any
 *   malformed line with file + line-number context. Designed to handle
 *   multi-GB files without loading them in memory.
 *
 * - writeJsonl: async iterator -> file, honouring backpressure so the
 *   write buffer never blows up on slow disks.
 *
 * Validation through Zod also acts as a security gate: data coming from
 * Discogs / MusicBrainz dumps is untrusted; if a value doesn't match,
 * the line is rejected before it can be processed further.
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createInterface } from 'node:readline';
import type { z, ZodTypeAny } from 'zod';

export async function* readJsonl<T extends ZodTypeAny>(
  filePath: string,
  schema: T,
): AsyncIterableIterator<z.infer<T>> {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });

  let lineNumber = 0;
  for await (const rawLine of lines) {
    lineNumber += 1;
    const trimmed = rawLine.trim();
    if (trimmed.length === 0) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (cause) {
      throw new Error(
        `[jsonl] JSON.parse failed at ${filePath}:${lineNumber}`,
        { cause },
      );
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `[jsonl] schema validation failed at ${filePath}:${lineNumber}\n` +
          JSON.stringify(result.error.flatten(), null, 2),
      );
    }
    yield result.data as z.infer<T>;
  }
}

export async function writeJsonl<T>(
  filePath: string,
  records: AsyncIterable<T> | Iterable<T>,
): Promise<number> {
  await mkdir(dirname(filePath), { recursive: true });
  const stream = createWriteStream(filePath, { encoding: 'utf-8' });

  let count = 0;
  try {
    for await (const record of records as AsyncIterable<T>) {
      const line = JSON.stringify(record) + '\n';
      // Honour backpressure: pause and wait for 'drain' if the buffer is full
      const ok = stream.write(line);
      if (!ok) {
        await new Promise<void>((resolve) =>
          stream.once('drain', () => resolve()),
        );
      }
      count += 1;
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      stream.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
  }
  return count;
}

/**
 * Convenience: count lines in a JSONL file without validating.
 * Useful for progress reports and sanity checks.
 */
export async function countJsonl(filePath: string): Promise<number> {
  const stream = createReadStream(filePath, { encoding: 'utf-8' });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  let count = 0;
  for await (const line of lines) {
    if (line.trim().length > 0) count += 1;
  }
  return count;
}