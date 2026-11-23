import { NextResponse } from 'next/server';
import { askClaude, claudeConfigured, claudeErrorStatus } from '@/lib/claude';
import { RULE_CATALOG, ZONES } from '@/lib/face/reading-rules';
import { SHAPE_NAMES } from '@/lib/face/style-rules';

export const runtime = 'nodejs';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT = `You are the friendly FacePangMuPang AI website assistant. The site measures a face with a 468-point mesh in the browser, gives a traditional face reading (โหงวเฮ้ง), shows which areas tradition believes could enhance the reading if adjusted, lets visitors create an AI concept image of those changes, and offers makeup, hair and clothing advice for people not ready for surgery.
Help visitors use the website and answer general questions about face reading traditions, personal style and cosmetic procedures. Reply in the same language as the visitor, concisely and respectfully.
- Present face reading as cultural belief ("ตามตำรา"), never as science or a prediction of the future or of someone's character.
- Give only general information about procedures (what they are, typical considerations). Never diagnose, never tell someone they should have surgery, never rank attractiveness, and suggest consulting a qualified doctor for personal decisions. Always mention non-surgical options when relevant.
- Format: plain text only, because the chat window does not render markdown. No **bold**, no headings, no tables. Short paragraphs; when you list items, start each line with "• ". Keep replies under about 150 words.
- In Thai, speak as a female assistant: always end polite sentences with ค่ะ/คะ, never ครับ, and refer to yourself as "เรา" if needed.
- You cannot see photos or the visitor's results. Don't ask for photos or private or sensitive personal information.`;

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 75_000) {
    return NextResponse.json({ error: 'ข้อความยาวเกินไป กรุณาย่อข้อความแล้วลองใหม่' }, { status: 413 });
  }
  if (!claudeConfigured()) {
    return NextResponse.json({ error: 'แชทยังไม่ได้ตั้งค่า API key กรุณาตั้ง ANTHROPIC_API_KEY ใน Vercel แล้ว redeploy' }, { status: 503 });
  }

  let body: { messages?: unknown; lang?: unknown; context?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'รูปแบบข้อความไม่ถูกต้อง' }, { status: 400 }); }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: 'กรุณาพิมพ์ข้อความก่อนส่ง' }, { status: 400 });
  }

  const messages: ChatMessage[] = body.messages.slice(-12).map((message: unknown): ChatMessage => {
    const item = message as { role?: unknown; content?: unknown };
    return {
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item?.content === 'string' ? item.content.trim().slice(0, 1500) : '',
    };
  }).filter(message => message.content.length > 0);
  // The API requires the conversation to start with a user turn.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'กรุณาพิมพ์ข้อความก่อนส่ง' }, { status: 400 });
  }

  try {
    const { text, refused } = await askClaude({ system: SYSTEM_PROMPT + contextBlock(body.lang, body.context), messages });
    if (refused) return NextResponse.json({ reply: 'ขออภัย เรื่องนี้ตอบให้ไม่ได้ ลองถามเรื่องอื่นเกี่ยวกับเว็บไซต์ได้เลยนะคะ' });
    if (!text) return NextResponse.json({ error: 'Claude ยังไม่ได้ส่งคำตอบ ลองใหม่อีกครั้งได้เลย' }, { status: 502 });
    return NextResponse.json({ reply: text });
  } catch (err) {
    const status = claudeErrorStatus(err);
    if (status === 429) return NextResponse.json({ error: 'ตอนนี้มีผู้ใช้แชทจำนวนมาก ลองใหม่อีกสักครู่นะคะ' }, { status: 429 });
    return NextResponse.json({ error: 'เชื่อมต่อ Claude ไม่สำเร็จ ตรวจสอบ API key และการตั้งค่าใน Vercel' }, { status: 502 });
  }
}

/** The visitor's reading, resolved from rule ids against server-side text (no client-provided prose, no photo). */
function contextBlock(lang: unknown, context: unknown) {
  const language = lang === 'en' ? 'English' : 'Thai';
  const out = [`\n\nThe site is currently shown in ${language}; reply in the visitor's language (default ${language}).`];
  const c = context as { faceShape?: unknown; readings?: unknown } | null;
  if (!c || !Array.isArray(c.readings)) {
    out.push('The visitor has not analyzed a face yet; you can suggest uploading a photo and pressing Analyze for a personal reading.');
    return out.join('\n');
  }
  const shape = typeof c.faceShape === 'string' && c.faceShape in SHAPE_NAMES ? SHAPE_NAMES[c.faceShape as keyof typeof SHAPE_NAMES].en : 'unknown';
  const lines = c.readings.filter((id): id is string => typeof id === 'string').slice(0, 40)
    .map(id => RULE_CATALOG.get(id)).filter(r => r !== undefined)
    .map(r => `- [${r.tone}${r.view === 'side' ? ', side view' : ''}] ${ZONES[r.zone].name.en}: ${r.title.en}${r.enhancement ? ` (enhancement idea: ${r.enhancement.procedure.en}; non-surgical: ${r.enhancement.nonSurgical.en})` : ''}`);
  out.push(
    "The visitor's measured face-reading results (from the site's rules; you still cannot see the photo):",
    `Face shape: ${shape}`,
    ...lines,
    'Use these results when they ask about "my" face or reading. Keep framing them as tradition, and offer non-surgical options alongside any procedure.',
  );
  return out.join('\n');
}

