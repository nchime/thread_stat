export type MediaNode = {
    id: string;
    media_product_type: string;
    media_type: string;
    media_url?: string;
    permalink: string;
    owner?: { id: string };
    username?: string;
    text?: string;
    timestamp: string;
    shortcode: string;
    thumbnail_url?: string;
    children?: { data: MediaNode[] };
    is_quote_post?: boolean;
};

// Fetches all media for the authenticated user, handling pagination.
export async function fetchAllMedia(accessToken: string, year: number): Promise<MediaNode[]> {
    // eslint-disable-next-line prefer-const
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
