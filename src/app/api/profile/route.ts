import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchProfile(accessToken: string) {
  const fields = 'id,username,threads_profile_picture_url';
  const url = `https://graph.threads.net/v1.0/me?fields=${fields}&access_token=${accessToken}`;

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMsg = errorData.error?.message || 'Failed to fetch profile from Threads API';
    console.error('Threads API Error:', errorData.error);
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function GET() {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Threads Access Token is not configured on the server.' }, { status: 500 });
  }

  try {
    const profile = await fetchProfile(accessToken);
    return NextResponse.json(profile);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
