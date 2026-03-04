import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeID, getYouTubeMetadata, getYouTubeTranscript, transcribeViaGateway } from '@/lib/youtube';

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

        // 3. Fallback: Try PHP Gateway (transcript API or yt-dlp + Whisper)
        let gatewayError = null;
        if (!transcript) {
            try {
                console.log(`[YouTube API] Trying PHP Gateway for ${videoID}`);
                const result = await transcribeViaGateway(videoID);
                if (result) {
                    transcript = result;
                } else {
                    gatewayError = 'Gateway berhasil terhubung tapi tidak mengembalikan teks transkrip (Whisper mungkin mengembalikan hasil kosong).';
                }
            } catch (err: any) {
                console.error('[YouTube API] Gateway failed:', err.message);
                gatewayError = `Gateway Error: ${err.message}`;
            }
        }

        if (!transcript) {
            let finalError = 'Gagal mendapatkan transkrip.';
            if (gatewayError) {
                finalError = `${gatewayError} (Opsi: Coba video lain yang memiliki subtitle 'CC')`;
            } else {
                finalError = 'Video ini tidak memiliki subtitle dan semua metode fallback gagal.';
            }

            return NextResponse.json({
                success: false,
                error: finalError
            }, { status: 422 });
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
