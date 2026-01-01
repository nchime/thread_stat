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

        // CSV Header
        const headers = ['Date', 'Time', 'Text', 'Media URL', 'Permalink', 'Media Type', 'Shortcode'];
        const csvRows = [headers.join(',')];

        // CSV Rows
        allMedia.forEach((media: MediaNode) => {
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
                media.shortcode
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
