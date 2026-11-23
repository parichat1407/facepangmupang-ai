import Anthropic from '@anthropic-ai/sdk';

/** Server-only helper for short text replies from Claude. Never import from client components. */
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

let client: Anthropic | null = null;
export function claudeConfigured() { return !!process.env.ANTHROPIC_API_KEY; }

export async function askClaude({ system, messages, maxTokens = 2000 }: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  maxTokens?: number;
}): Promise<{ text: string; refused: boolean }> {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages,
    output_config: { effort: 'low' }, // short conversational replies
    // Server-side fallback if a safety classifier declines the request.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
  if (response.stop_reason === 'refusal') return { text: '', refused: true };
  const text = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map(b => b.text).join('\n').trim();
  return { text, refused: false };
}

export function claudeErrorStatus(err: unknown) {
  if (err instanceof Anthropic.RateLimitError) return 429;
  if (err instanceof Anthropic.AuthenticationError) return 401;
  return 502;
}
