import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeID, getYouTubeMetadata, getYouTubeTranscript, downloadYouTubeAudio, transcribeAudio } from '@/lib/youtube';

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
            transcript = await getYouTubeTranscript(videoID);
        } catch (scrapeError) {
            console.warn('[YouTube API] Native scraping failed, will try Whisper.', scrapeError);
        }

        // 3. Fallback to Whisper if scraping failed or returned empty
        if (!transcript) {
            try {
                console.log(`[YouTube API] Scraping failed or empty. Starting Whisper fallback for ${videoID}`);
                const audioPath = await downloadYouTubeAudio(videoID);
                transcript = await transcribeAudio(audioPath, videoID);
            } catch (transcribeError: any) {
                console.error('[YouTube API] Whisper failed:', transcribeError);

                let errorMessage = 'Gagal melakukan transkripsi AI.';
                if (transcribeError.message?.includes('command not found')) {
                    errorMessage = 'Akses Whisper (Download) tidak tersedia di server ini (yt-dlp tidak terinstall). Hubungi admin atau gunakan platform VPS/Local.';
                } else {
                    errorMessage += ' ' + (transcribeError.message || '');
                }

                return NextResponse.json({
                    success: false,
                    error: errorMessage
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
