import { NextResponse } from 'next/server';
import { askClaude, claudeConfigured, claudeErrorStatus } from '@/lib/claude';
import { ZONES, RULE_CATALOG } from '@/lib/face/reading-rules';
import { SHAPE_NAMES } from '@/lib/face/style-rules';

export const runtime = 'nodejs';

const SYSTEM = `You write short, warm, personalised face-reading (โหงวเฮ้ง) summaries for the FacePangMuPang website.
You receive only measurement-derived rule results — you never see the person's photo, so never describe their appearance beyond those results.
Rules:
- Base everything on the rule results provided. Do not invent new features or measurements.
- Frame face reading as cultural belief ("ตามตำรา" / "tradition holds"), never as fact or prediction.
- Mention the strongest points first, then the enhancement points as optional ideas, each with a non-surgical alternative. Never pressure anyone toward surgery; say a qualified doctor should be consulted before any procedure.
- No medical diagnosis, no ranking of attractiveness, no claims about character as fact.
- 120–180 words, plain prose in 2 short paragraphs, no headings, no bullet lists, no markdown.`;

const VALID_SHAPES = Object.keys(SHAPE_NAMES);

export async function POST(request: Request) {
  if (!claudeConfigured()) return NextResponse.json({ error: 'not-configured' }, { status: 503 });
  let body: { lang?: unknown; faceShape?: unknown; readings?: unknown; enhancements?: unknown; metrics?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 }); }

  const lang = body.lang === 'en' ? 'en' : 'th';
  const shape = typeof body.faceShape === 'string' && VALID_SHAPES.includes(body.faceShape) ? body.faceShape as keyof typeof SHAPE_NAMES : null;
  const ids = Array.isArray(body.readings) ? body.readings.filter((x): x is string => typeof x === 'string').slice(0, 30) : [];
  if (!shape || !ids.length) return NextResponse.json({ error: 'Missing reading data.' }, { status: 400 });

  // Resolve ids against the server's own rule text so the client can't inject prompt content.
  const lines = ids.map(id => RULE_CATALOG.get(id)).filter(Boolean).map(r => `- [${r!.tone}] ${ZONES[r!.zone].name.en} (${ZONES[r!.zone].area.en}): ${r!.title.en}${r!.enhancement ? ` | enhancement: ${r!.enhancement.procedure.en}; tradition says: ${r!.enhancement.beliefGain.en}; non-surgical: ${r!.enhancement.nonSurgical.en}` : ''}`);
  if (!lines.length) return NextResponse.json({ error: 'Unknown reading ids.' }, { status: 400 });

  const prompt = `Write the summary in ${lang === 'th' ? 'Thai' : 'English'}.
Face shape: ${SHAPE_NAMES[shape].en}
Rule results:
${lines.join('\n')}`;

  try {
    const { text, refused } = await askClaude({ system: SYSTEM, messages: [{ role: 'user', content: prompt }], maxTokens: 1500 });
    if (refused || !text) return NextResponse.json({ error: 'No summary available.' }, { status: 502 });
    return NextResponse.json({ summary: text });
  } catch (err) {
    console.error('face-reading summary failed', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Summary failed.' }, { status: claudeErrorStatus(err) });
  }
}
