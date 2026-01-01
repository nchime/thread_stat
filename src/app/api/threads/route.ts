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
  const metric = searchParams.get('metric') || 'count'; // 'count' or 'views'
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  if (!accessToken) {
    return NextResponse.json({ error: 'Threads Access Token is not configured on the server.' }, { status: 500 });
  }

  try {
    const allMedia = await fetchAllMedia(accessToken, year);

    let aggregated: AggregatedData = {};

    if (metric === 'views') {
      // Fetch views for all media
      // Note: This might be slow and hit rate limits for many posts
      const mediaWithViews = await Promise.all(allMedia.map(async (media: MediaNode) => {
        try {
          const insightUrl = `https://graph.threads.net/v1.0/${media.id}/insights?metric=views&access_token=${accessToken}`;
          const insightRes = await fetch(insightUrl, { cache: 'no-store' });

          if (insightRes.ok) {
            const insightData = await insightRes.json();
            // Structure: { data: [ { name: 'views', values: [ { value: 123 } ] } ] }
            const viewsMetric = insightData.data?.find((m: any) => m.name === 'views');
            const views = viewsMetric?.values?.[0]?.value || 0;
            return { ...media, views };
          }
        } catch (error) {
          console.error(`Failed to fetch insights for media ${media.id}:`, error);
        }
        return { ...media, views: 0 };
      }));

      aggregated = mediaWithViews.reduce((acc: AggregatedData, media: any) => {
        const date = media.timestamp.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count += media.views;
        return acc;
      }, {});

    } else {
      // Default: Count posts
      aggregated = allMedia.reduce((acc: AggregatedData, media: MediaNode) => {
        const date = media.timestamp.split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0 };
        }
        acc[date].count++;
        return acc;
      }, {});
    }

    return NextResponse.json(Object.values(aggregated));
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
