import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeID, getYouTubeMetadata, downloadYouTubeAudio, transcribeAudio } from '@/lib/youtube';

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

        // 2. Transcribe via Whisper (Primary Method)
        let transcript = '';
        try {
            console.log(`[YouTube API] Starting Whisper transcription for ${videoID}`);
            const audioPath = await downloadYouTubeAudio(videoID);
            transcript = await transcribeAudio(audioPath);
        } catch (transcribeError: any) {
            console.error('[YouTube API] Whisper failed:', transcribeError);
            // We could fallback to scraping here if we wanted, 
            // but user said "pakai whisper aja"
            return NextResponse.json({
                success: false,
                error: 'Gagal melakukan transkripsi AI (Whisper). ' + (transcribeError.message || '')
            }, { status: 500 });
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
