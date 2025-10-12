import { NextResponse } from 'next/server';
import { getAccessToken } from '../store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = getAccessToken();
  return NextResponse.json({ exists: !!token });
}
