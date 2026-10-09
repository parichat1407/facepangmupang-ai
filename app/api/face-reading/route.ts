import { NextResponse } from 'next/server';
import { faceReadingMock } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await faceReadingMock(body.features || {}));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }
}
