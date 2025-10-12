import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchPosts(accessToken: string, since: number, until: number) {
  const fields = 'id,text,timestamp,media_url,permalink,media_type';
  const url = `https://graph.threads.net/v1.0/me/threads?fields=${fields}&since=${since}&until=${until}&access_token=${accessToken}`;

  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMsg = errorData.error?.message || 'Failed to fetch posts from Threads API';
    console.error('Threads API Error:', errorData.error);
    throw new Error(errorMsg);
  }

  return response.json();
}

import { getAccessToken } from '../token/store';

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: 'Threads Access Token is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  if (!dateParam) {
    return NextResponse.json({ error: 'Date parameter is required.' }, { status: 400 });
  }

  const date = new Date(dateParam);
  const since = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime() / 1000);
  const until = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).getTime() / 1000);

  try {
    const posts = await fetchPosts(accessToken, since, until);
    return NextResponse.json(posts);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
