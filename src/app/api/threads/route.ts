import { NextRequest, NextResponse } from 'next/server';

// This ensures this route is always executed dynamically and not cached.
export const dynamic = 'force-dynamic';

import { fetchAllMedia, MediaNode } from '../services/threads';

type AggregatedData = {
  [key: string]: {
    date: string;
    count: number;
  };
};

import { getAccessToken } from '../token/store';

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken();
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (!accessToken) {
    return NextResponse.json({ error: 'Threads Access Token is not configured on the server.' }, { status: 500 });
  }

  try {
    const allMedia = await fetchAllMedia(accessToken, year);

    const aggregated: AggregatedData = allMedia.reduce((acc: AggregatedData, media: MediaNode) => {
      const date = media.timestamp.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0 };
      }
      acc[date].count++;
      return acc;
    }, {});

    return NextResponse.json(Object.values(aggregated));
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
