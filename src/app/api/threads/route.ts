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

    } else if (metric === 'detailed') {
      // Fetch ALL metrics for detailed chart
      const metricsToFetch = 'views,likes,replies,reposts,quotes';

      const mediaWithMetrics = await Promise.all(allMedia.map(async (media: MediaNode) => {
        let metrics: any = { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0 };
        try {
          const insightUrl = `https://graph.threads.net/v1.0/${media.id}/insights?metric=${metricsToFetch}&access_token=${accessToken}`;
          const res = await fetch(insightUrl, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              data.data.forEach((m: any) => {
                const val = m.values?.[0]?.value || 0;
                if (m.name === 'views') metrics.views = val;
                if (m.name === 'likes') metrics.likes = val;
                if (m.name === 'replies') metrics.replies = val;
                if (m.name === 'reposts') metrics.reposts = val;
                if (m.name === 'quotes') metrics.quotes = val;
              });
            }
          }
        } catch (err) {
          console.error(`Failed to fetch detailed insights for ${media.id}`, err);
        }
        return { ...media, ...metrics };
      }));

      // Aggregate by Date
      // Note: We are returning AggregatedData which expects key -> { date, count }.
      // But here we want to return MORE data.
      // Modifying AggregatedData type locally would be messy if we don't update the type definition.
      // However, we just return Object.values(aggregated).
      // So we can store extra fields in the object.

      const detailedAggregated: any = {};

      mediaWithMetrics.forEach((media: any) => {
        const date = media.timestamp.split('T')[0];
        if (!detailedAggregated[date]) {
          detailedAggregated[date] = {
            date,
            count: 0,
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0
          };
        }
        detailedAggregated[date].count += 1; // Post count
        detailedAggregated[date].views += media.views;
        detailedAggregated[date].likes += media.likes;
        detailedAggregated[date].replies += media.replies;
        detailedAggregated[date].reposts += media.reposts;
        detailedAggregated[date].quotes += media.quotes;
      });

      return NextResponse.json({
        dailyStats: Object.values(detailedAggregated).sort((a: any, b: any) => a.date.localeCompare(b.date)),
        topPosts: mediaWithMetrics
          .sort((a: any, b: any) => b.views - a.views)
          .slice(0, 10)
      });

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
