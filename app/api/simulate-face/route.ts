import { NextResponse } from 'next/server';
import { simulateFaceMock } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Expected image and changes.' }, { status: 400 });
    return NextResponse.json(await simulateFaceMock(body.changes || {}));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
}
