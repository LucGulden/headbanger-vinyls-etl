/**
 * Client Cover Art Archive API
 */

let lastRequestTime = 0;
const MIN_DELAY = 500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCoverUrl(releaseId: string): Promise<string | undefined> {
  const now = Date.now();
  if (now - lastRequestTime < MIN_DELAY) {
    await sleep(MIN_DELAY - (now - lastRequestTime));
  }
  lastRequestTime = Date.now();

  try {
    const response = await fetch(`https://coverartarchive.org/release/${releaseId}`, {
      headers: { 'User-Agent': 'FillCrate/2.0' },
    });

    if (response.status === 404 || !response.ok) return undefined;

    const data: {
      images: {
        front: boolean;
        image: string;
        thumbnails: { '500'?: string; large?: string };
      }[];
    } = await response.json();

    if (!data.images?.length) return undefined;

    const front = data.images.find(img => img.front) || data.images[0];
    return front.thumbnails['500'] || front.thumbnails.large || front.image;
  } catch {
    return undefined;
  }
}
