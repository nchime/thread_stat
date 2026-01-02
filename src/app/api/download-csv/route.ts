import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '../token/store';
import { fetchAllMedia, MediaNode } from '../services/threads';

export const dynamic = 'force-dynamic';

function escapeCsv(text: string | undefined): string {
    if (!text) return '';
    // Convert newlines to spaces and escape double quotes
    const escaped = text.replace(/"/g, '""').replace(/\n/g, ' ');
    return `"${escaped}"`;
}

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

        // Fetch metrics for each media item
        // Note: 'followers_count' is typically a user-level metric, not per-post.
        // We will request common post metrics.
        const metricsToFetch = 'views,likes,replies,reposts,quotes';

        const mediaWithMetrics = await Promise.all(allMedia.map(async (media: MediaNode) => {
            let metrics: any = {
                views: 0,
                likes: 0,
                replies: 0,
                reposts: 0,
                quotes: 0
            };

            try {
                // Fetch insights for this specific media
                const insightUrl = `https://graph.threads.net/v1.0/${media.id}/insights?metric=${metricsToFetch}&access_token=${accessToken}`;
                const res = await fetch(insightUrl, { cache: 'no-store' });

                if (res.ok) {
                    const data = await res.json();
                    // data.data is array of struct: { name: 'views', values: [{ value: 123 }] }
                    if (data.data) {
                        data.data.forEach((metric: any) => {
                            const val = metric.values?.[0]?.value || 0;
                            if (metric.name === 'views') metrics.views = val;
                            if (metric.name === 'likes') metrics.likes = val;
                            if (metric.name === 'replies') metrics.replies = val;
                            if (metric.name === 'reposts') metrics.reposts = val;
                            if (metric.name === 'quotes') metrics.quotes = val;
                        });
                    }
                }
            } catch (err) {
                console.error(`Failed to fetch insights for ${media.id}`, err);
            }

            return { ...media, ...metrics };
        }));

        // CSV Header
        const headers = [
            'Date', 'Time', 'Text', 'Media URL', 'Permalink', 'Media Type', 'Shortcode',
            'Views', 'Likes', 'Replies', 'Reposts', 'Quotes'
        ];
        const csvRows = [headers.join(',')];

        // CSV Rows
        mediaWithMetrics.forEach((media: any) => {
            const dateObj = new Date(media.timestamp);
            const date = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY
            const time = dateObj.toLocaleTimeString('en-GB'); // HH:MM:SS

            const row = [
                date,
                time,
                escapeCsv(media.text),
                media.media_url || '',
                media.permalink,
                media.media_type,
                media.shortcode,
                media.views,
                media.likes,
                media.replies,
                media.reposts,
                media.quotes
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="threads_archive_${year}.csv"`,
            },
        });

    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
}
