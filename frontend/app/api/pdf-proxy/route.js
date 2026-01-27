
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing PDF URL' }, { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`PDF Proxy Fetch Error: ${response.status} ${response.statusText}`);
            return NextResponse.json({ error: 'Failed to fetch PDF from source' }, { status: response.status });
        }

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Access-Control-Allow-Origin', '*'); // Optional, but good for debugging

        return new NextResponse(response.body, {
            status: 200,
            statusText: 'OK',
            headers
        });
    } catch (error) {
        console.error('PDF Proxy Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error refreshing PDF' }, { status: 500 });
    }
}
