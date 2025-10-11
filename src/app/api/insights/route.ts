import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function fetchInsights(accessToken: string, since: number, until: number) {
  const metrics = 'views,likes,replies,reposts,followers_count';
  const url = `https://graph.threads.net/v1.0/me/threads_insights?metric=${metrics}&since=${since}&until=${until}&access_token=${accessToken}`;

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMsg = errorData.error?.message || 'Failed to fetch insights from Threads API';
    console.error('Threads API Error:', errorData.error);
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Threads Access Token is not configured on the server.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const since = Math.floor(new Date(year, 0, 1).getTime() / 1000);
  let until;
  const currentYear = new Date().getFullYear();

  if (year === currentYear) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    until = Math.floor(new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59).getTime() / 1000);
  } else {
    until = Math.floor(new Date(year, 11, 31, 23, 59, 59).getTime() / 1000);
  }

  try {
    const insights = await fetchInsights(accessToken, since, until);
    return NextResponse.json(insights);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
