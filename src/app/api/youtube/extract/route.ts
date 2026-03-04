import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeID, getYouTubeMetadata, getYouTubeTranscript, transcribeViaGateway, getTranscriptFromRapidAPI } from '@/lib/youtube';

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

        // 2. Try RapidAPI (Managed - 100% Stable)
        let rapidApiError = null;
        if (!transcript) {
            if (!process.env.RAPIDAPI_KEY) {
                console.warn('[YouTube API] RAPIDAPI_KEY is missing on Vercel');
                rapidApiError = 'API Key RapidAPI belum dipasang di Vercel.';
            } else {
                try {
                    const rapidResult = await getTranscriptFromRapidAPI(videoID);
                    if (rapidResult) {
                        transcript = rapidResult;
                    } else {
                        rapidApiError = 'RapidAPI tidak menemukan transkrip untuk video ini.';
                    }
                } catch (err: any) {
                    console.error('[YouTube API] RapidAPI failed:', err.message);
                    rapidApiError = `RapidAPI Error: ${err.message}`;
                }
            }
        }

        // 3. Fallback: Try PHP Gateway (yt-dlp + Whisper)
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
            if (rapidApiError && !gatewayError) {
                finalError = `RapidAPI gagal (${rapidApiError}). Mencoba gateway...`;
            }

            if (gatewayError) {
                const cookieStatus = process.env.EXTERNAL_TRANSCRIPTION_KEY ? 'Gateway aktif' : 'Gateway key missing';
                finalError = `Semua metode gagal.\n1. ${rapidApiError || 'RapidAPI gagal'}\n2. ${gatewayError}\n\nTips: Pastikan RAPIDAPI_KEY sudah diisi di Vercel Dashboard dan video memiliki "CC".`;
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
