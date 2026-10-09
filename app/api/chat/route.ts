import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT = `You are the friendly FacePangMuPang AI website assistant. Help visitors understand how to use the website and answer general questions about personal style and the site's face-reading section. Reply in the same language as the visitor, with concise and respectful wording. The site's face analysis and simulations are demos, not medical assessments or predictions. Do not diagnose, rank attractiveness, recommend surgery, infer personality or character from appearance, request photos, or claim that you can see or analyze a face. If asked about medical procedures, give general information only and suggest consulting a qualified professional. Never ask for private or sensitive personal information.`;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 75_000) {
    return NextResponse.json({ error: 'ข้อความยาวเกินไป กรุณาย่อข้อความแล้วลองใหม่' }, { status: 413 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'แชทยังไม่ได้ตั้งค่า API key กรุณาตั้ง ANTHROPIC_API_KEY ใน Vercel แล้ว redeploy' }, { status: 503 });
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'รูปแบบข้อความไม่ถูกต้อง' }, { status: 400 });
  }

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

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'กรุณาพิมพ์ข้อความก่อนส่ง' }, { status: 400 });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages,
      }),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return NextResponse.json({ error: 'ตอนนี้มีผู้ใช้แชทจำนวนมาก ลองใหม่อีกสักครู่นะคะ' }, { status: 429 });
      }
      return NextResponse.json({ error: 'เชื่อมต่อ Claude ไม่สำเร็จ ตรวจสอบ API key และการตั้งค่าใน Vercel' }, { status: 502 });
    }

    const result = await upstream.json();
    const reply = Array.isArray(result.content)
      ? result.content.filter((block: { type?: string; text?: unknown }) => block.type === 'text' && typeof block.text === 'string').map((block: { text: string }) => block.text).join('\n').trim()
      : '';

    if (!reply) return NextResponse.json({ error: 'Claude ยังไม่ได้ส่งคำตอบ ลองใหม่อีกครั้งได้เลย' }, { status: 502 });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'เชื่อมต่อแชทไม่สำเร็จ ลองตรวจการเชื่อมต่ออินเทอร์เน็ตแล้วส่งอีกครั้ง' }, { status: 502 });
  }
}
