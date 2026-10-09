import { NextResponse } from 'next/server';
import { analyzeFaceMock } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    // Prototype only: don't persist incoming photo data. Real CV processing belongs here.
    await request.json();
    return NextResponse.json(await analyzeFaceMock());
  } catch {
    return NextResponse.json({ error: 'Invalid request. Send JSON with image and optional preferences.' }, { status: 400 });
  }
}
