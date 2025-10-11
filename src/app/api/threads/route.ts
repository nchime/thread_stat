import { NextRequest, NextResponse } from 'next/server';

// This ensures this route is always executed dynamically and not cached.
export const dynamic = 'force-dynamic';

type MediaNode = {
  id: string;
  timestamp: string;
};

type AggregatedData = {
  [key: string]: {
    date: string;
    count: number;
  };
};

// Fetches all media for the authenticated user, handling pagination.
async function fetchAllMedia(accessToken: string, year: number): Promise<MediaNode[]> {
  let allMedia: MediaNode[] = [];
  
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

  const fields = 'id,media_product_type,media_type,media_url,permalink,owner,username,text,timestamp,shortcode,thumbnail_url,children,is_quote_post';
  let url = `https://graph.threads.net/v1.0/me/threads?fields=${fields}&since=${since}&until=${until}&limit=100&access_token=${accessToken}`;

  while (url) {
    // Use { cache: 'no-store' } to prevent caching of the fetch request.
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Failed to fetch data from Threads API';
      console.error('Threads API Error:', data.error);
      throw new Error(errorMsg);
    }

    const media = data.data as MediaNode[];
    if (!media || media.length === 0) {
      break;
    }

    allMedia.push(...media);
    url = data.paging?.next;
  }

  return allMedia;
}

export async function GET(request: NextRequest) {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
