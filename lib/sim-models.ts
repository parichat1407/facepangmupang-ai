/** Image-editing models offered in compare mode (prices from AI Gateway at ~1024px, Nov 2026). */
export const COMPARE_MODELS = [
  { id: 'bytedance/seedream-4.0', label: 'Seedream 4.0', maker: 'ByteDance', price: 0.03 }, // site default
  { id: 'bfl/flux-kontext-pro', label: 'FLUX Kontext Pro', maker: 'Black Forest Labs', price: 0.04 }, // works on free-tier credits
  { id: 'bfl/flux-3-image', label: 'FLUX 3', maker: 'Black Forest Labs', price: 0.048 },
  { id: 'bytedance/seedream-5.5', label: 'Seedream 5.5', maker: 'ByteDance', price: 0.02 },
  { id: 'google/gemini-nano-banana-2.1', label: 'Nano Banana 2.1', maker: 'Google', price: 0.034 },
] as const;

export type CompareModelId = (typeof COMPARE_MODELS)[number]['id'];

export const COMPARE_TOTAL = COMPARE_MODELS.reduce((sum, m) => sum + m.price, 0);

/** Google's Gemini image models are language models on the gateway: they need generateText, not generateImage. */
export const isLanguageImageModel = (id: string) => id.startsWith('google/gemini');

/** Compare mode costs ~3× per click, so it is on in `next dev` and only opt-in elsewhere. */
export const compareEnabled = () => process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SIM_COMPARE === '1';

export function modelLabel(id: string | undefined) {
  return COMPARE_MODELS.find(m => m.id === id)?.label ?? id?.split('/').pop() ?? '';
}
