import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tokenExists = !!process.env.THREADS_ACCESS_TOKEN;
  return NextResponse.json({ exists: tokenExists });
}
