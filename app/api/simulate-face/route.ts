import { NextResponse } from 'next/server';
import { generateImage, generateText, NoImageGeneratedError } from 'ai';
import { SIM_PROMPTS } from '@/lib/face/reading-rules';
import { COMPARE_MODELS, compareEnabled, isLanguageImageModel } from '@/lib/sim-models';

export const runtime = 'nodejs';
export const maxDuration = 120;

// flux-3, seedream-5.5 and nano banana need paid, non-free-tier gateway credits.
const MODEL = process.env.SIMULATION_MODEL || 'bytedance/seedream-4.0';
const MAX_IMAGE_B64 = 3_500_000; // ~2.6 MB JPEG; client sends ≤1024px so this is generous.
const LEVEL_WORDS = { natural: 'very subtle, barely noticeable', balanced: 'moderate but natural-looking', defined: 'clearly visible yet realistic' } as const;
type Level = keyof typeof LEVEL_WORDS;

const msg = (lang: string, th: string, en: string) => (lang === 'en' ? en : th);

class NoImageReturned extends Error {}

/**
 * ByteDance Seedream ignores aspectRatio and returns 2048×2048 unless given a size, which reframes the photo.
 * Ask for the source photo's aspect ratio at ~2 MP (Seedream needs ≥ ~0.9 MP; multiples of 64).
 */
function bytedanceSize(width: number, height: number): `${number}x${number}` | undefined {
  if (!(width > 0 && height > 0)) return undefined;
  const ratio = Math.min(3, Math.max(1 / 3, width / height));
  const h = Math.sqrt(2_000_000 / ratio);
  const round = (n: number) => Math.max(640, Math.round(n / 64) * 64);
  return `${round(h * ratio)}x${round(h)}`;
}

/** Image models go through generateImage; Gemini image models are language models and return images as files. */
async function editImage(model: string, prompt: string, image: string, abortSignal: AbortSignal, dims: { width: number; height: number }) {
  if (isLanguageImageModel(model)) {
    const result = await generateText({
      model,
      abortSignal,
      providerOptions: { google: { responseModalities: ['TEXT', 'IMAGE'] } },
      messages: [{ role: 'user', content: [{ type: 'file', mediaType: 'image/jpeg', data: image }, { type: 'text', text: prompt }] }],
    });
    const file = result.files.find(f => f.mediaType.startsWith('image/'));
    if (!file) throw new NoImageReturned();
    return { base64: file.base64, mediaType: file.mediaType };
  }
  const bytedance = model.startsWith('bytedance/');
  const { image: out } = await generateImage({
    model, prompt: { text: prompt, images: [image] }, abortSignal,
    ...(bytedance ? { size: bytedanceSize(dims.width, dims.height), providerOptions: { bytedance: { watermark: false } } } : {}),
  });
  return { base64: out.base64, mediaType: out.mediaType || 'image/png' };
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 4_000_000) {
    return NextResponse.json({ error: 'รูปใหญ่เกินไป / Image is too large' }, { status: 413 });
  }
  let body: { image?: unknown; ids?: unknown; level?: unknown; note?: unknown; lang?: unknown; view?: unknown; model?: unknown; width?: unknown; height?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 }); }

  const lang = body.lang === 'en' ? 'en' : 'th';
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json({ error: msg(lang, 'ยังไม่ได้ตั้งค่า AI Gateway (AI_GATEWAY_API_KEY) จึงสร้างภาพจำลองไม่ได้', 'AI Gateway is not configured (AI_GATEWAY_API_KEY), so simulations are unavailable.') }, { status: 503 });
  }
  if (typeof body.image !== 'string' || body.image.length < 100 || body.image.length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/=]+$/.test(body.image)) {
    return NextResponse.json({ error: msg(lang, 'รูปไม่ถูกต้องหรือใหญ่เกินไป', 'The image is missing, invalid or too large.') }, { status: 400 });
  }
  // Only server-known instructions are used for selected points; free text is short and optional.
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string' && id in SIM_PROMPTS).slice(0, 6) : [];
  const note = typeof body.note === 'string' ? body.note.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200) : '';
  if (!ids.length && !note) {
    return NextResponse.json({ error: msg(lang, 'กรุณาเลือกอย่างน้อยหนึ่งจุด', 'Please select at least one point.') }, { status: 400 });
  }
  const level: Level = body.level === 'balanced' || body.level === 'defined' ? body.level : 'natural';

  // Visitors can only pick a model from the compare list, and only where compare mode is enabled.
  let model = MODEL;
  if (typeof body.model === 'string' && body.model !== MODEL) {
    if (!compareEnabled() || !COMPARE_MODELS.some(m => m.id === body.model)) {
      return NextResponse.json({ error: msg(lang, 'ไม่รองรับโมเดลนี้', 'This model is not available.') }, { status: 403 });
    }
    model = body.model;
  }

  const changes = ids.map(id => `- ${SIM_PROMPTS[id]}`);
  if (note) changes.push(`- Additional request from the person (apply only if it is a cosmetic facial change): "${note}"`);
  const prompt = [
    body.view === 'side'
      ? 'Edit this side-profile portrait photo of the same person to visualise a cosmetic facial change, keeping the exact side-profile angle.'
      : 'Edit this portrait photo of the same person to visualise a cosmetic facial change.',
    `Apply only these changes, ${LEVEL_WORDS[level]}:`,
    ...changes,
    'Keep the person clearly recognisable: same identity, age, skin tone and texture, hairstyle, expression, head pose, lighting, background, clothing and camera framing.',
    'Do not add makeup, filters, beautification or any other changes. Photorealistic result.',
  ].join('\n');

  const started = Date.now();
  try {
    const dim = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(4096, Math.max(1, Math.round(v))) : 0);
    const out = await editImage(model, prompt, body.image, request.signal, { width: dim(body.width), height: dim(body.height) });
    return NextResponse.json({ image: out.base64, mediaType: out.mediaType, model, ms: Date.now() - started });
  } catch (err) {
    console.error('simulate-face failed', model, err instanceof Error ? err.message : err);
    const blocked = NoImageGeneratedError.isInstance(err) || err instanceof NoImageReturned;
    // The gateway refuses some models on free-tier credits; say so instead of a generic failure.
    const detail = err instanceof Error ? `${err.message} ${String((err as { cause?: unknown }).cause ?? '')}` : '';
    if (/free tier/i.test(detail)) {
      return NextResponse.json({
        error: msg(lang, 'โมเดลนี้ใช้กับเครดิตฟรีของ AI Gateway ไม่ได้ ต้องเติมเครดิตแบบชำระเงินก่อน', 'This model is not available on free AI Gateway credits. A paid top-up is required.'),
        code: 'free-tier',
      }, { status: 402 });
    }
    if (/insufficient|balance|credit/i.test(detail)) {
      return NextResponse.json({ error: msg(lang, 'เครดิต AI Gateway ไม่พอ', 'Not enough AI Gateway credits.'), code: 'credits' }, { status: 402 });
    }
    return NextResponse.json({
      error: blocked
        ? msg(lang, 'ผู้ให้บริการไม่สร้างภาพนี้ ลองเลือกจุดอื่นหรือใช้รูปอื่น', 'The provider did not return an image. Try other points or another photo.')
        : msg(lang, 'สร้างภาพจำลองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'Could not create the simulation. Please try again.'),
    }, { status: 502 });
  }
}
