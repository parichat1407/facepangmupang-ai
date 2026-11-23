/**
 * Server-only: FLUX.1 Kontext [dev] via Replicate.
 * FLUX.1 Kontext [dev] is Black Forest Labs' open-weight image-editing model (it is not on
 * Vercel AI Gateway, which only offers the closed Kontext Pro/Max), so it is called directly.
 */

export const FLUX_DEV_ID = 'replicate/flux-kontext-dev';
const REPLICATE_MODEL = process.env.REPLICATE_FLUX_MODEL || 'black-forest-labs/flux-kontext-dev';
const REPLICATE_API = 'https://api.replicate.com/v1';
const MAX_WAIT_MS = 110_000;

export const isReplicateModel = (id: string) => id.startsWith('replicate/');
export const replicateConfigured = () => Boolean(process.env.REPLICATE_API_TOKEN);

export class ReplicateError extends Error {
  constructor(message: string, public code: 'auth' | 'credits' | 'rate' | 'timeout' | 'blocked' | 'failed') {
    super(message);
  }
}

type Prediction = {
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get?: string };
};

/** Edits a JPEG (raw base64, no data: prefix) and returns the result as base64. */
export async function fluxKontextDevEdit(imageBase64: string, prompt: string, abortSignal: AbortSignal) {
  const headers = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' };
  const started = Date.now();

  const res = await fetch(`${REPLICATE_API}/models/${REPLICATE_MODEL}/predictions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'wait=60' },
    body: JSON.stringify({
      input: {
        prompt,
        input_image: `data:image/jpeg;base64,${imageBase64}`,
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
        num_inference_steps: 28,
        guidance: 2.5,
        go_fast: true,
      },
    }),
    signal: abortSignal,
    cache: 'no-store',
  });
  if (res.status === 401) throw new ReplicateError('invalid Replicate token', 'auth');
  if (res.status === 402) throw new ReplicateError('Replicate account has no credit', 'credits');
  if (res.status === 429) throw new ReplicateError('Replicate rate limit', 'rate');
  if (!res.ok) throw new ReplicateError(`Replicate error ${res.status}`, 'failed');

  let prediction = (await res.json()) as Prediction;
  while (prediction.status === 'starting' || prediction.status === 'processing') {
    if (Date.now() - started > MAX_WAIT_MS || !prediction.urls?.get) throw new ReplicateError('Replicate timed out', 'timeout');
    await new Promise(r => setTimeout(r, 2000));
    const poll = await fetch(prediction.urls.get, { headers, signal: abortSignal, cache: 'no-store' });
    if (!poll.ok) throw new ReplicateError(`Replicate error ${poll.status}`, 'failed');
    prediction = (await poll.json()) as Prediction;
  }

  if (prediction.status !== 'succeeded') {
    const blocked = /nsfw|safety/i.test(prediction.error || '');
    throw new ReplicateError(prediction.error || 'Replicate prediction failed', blocked ? 'blocked' : 'failed');
  }
  const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!url) throw new ReplicateError('Replicate returned no image', 'blocked');

  // Fetch the result server-side so the browser never talks to Replicate.
  const img = await fetch(url, { signal: abortSignal, cache: 'no-store' });
  if (!img.ok) throw new ReplicateError('Could not download the Replicate result', 'failed');
  return {
    base64: Buffer.from(await img.arrayBuffer()).toString('base64'),
    mediaType: img.headers.get('content-type') || 'image/jpeg',
  };
}
