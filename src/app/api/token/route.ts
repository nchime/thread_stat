import { NextRequest, NextResponse } from 'next/server';
import { setAccessToken } from './store';

export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
  }

  try {
    setAccessToken(token);
    return NextResponse.json({ message: 'Token updated successfully.' });
  } catch (error) {
    console.error('Failed to update token:', error);
    return NextResponse.json({ error: 'Failed to update token.' }, { status: 500 });
  }
}
