import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeID, getYouTubeMetadata, getYouTubeTranscript, transcribeFromYouTubeURL } from '@/lib/youtube';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
        }

        const videoID = getYouTubeID(url);
        if (!videoID) {
            return NextResponse.json({ success: false, error: 'Invalid YouTube URL' }, { status: 400 });
        }

        // 1. Get Metadata first (Fast)
        const metadata = await getYouTubeMetadata(videoID);

        // 2. Try Fast Scraper first (Vercel-friendly)
        let transcript = '';
        try {
            console.log(`[YouTube API] Attempting native scraping for ${videoID}`);
            const result = await getYouTubeTranscript(videoID);
            if (result) transcript = result;
        } catch (scrapeError) {
            console.warn('[YouTube API] Native scraping failed, will try Whisper.', scrapeError);
        }

        // 3. Fallback to Whisper via in-memory streaming (no yt-dlp needed!)
        if (!transcript) {
            try {
                console.log(`[YouTube API] Transcript empty. Starting in-memory Whisper for ${videoID}`);
                transcript = await transcribeFromYouTubeURL(videoID);
            } catch (transcribeError: any) {
                console.error('[YouTube API] Whisper in-memory failed:', transcribeError);
                return NextResponse.json({
                    success: false,
                    error: 'Gagal melakukan transkripsi AI. ' + (transcribeError.message || '')
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                videoID,
                title: metadata?.title || 'Unknown Title',
                thumbnail: metadata?.thumbnail_url || `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`,
                author: metadata?.author_name || 'YouTube',
                transcript
            }
        });

    } catch (error: any) {
        console.error('[YouTube API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
