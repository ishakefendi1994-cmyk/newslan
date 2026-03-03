import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeID, downloadYouTubeAudio, transcribeAudio } from '@/lib/youtube';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const videoId = getYouTubeID(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }

        // 1. Download audio
        let audioPath: string;
        try {
            audioPath = await downloadYouTubeAudio(videoId);
        } catch (downloadError: any) {
            return NextResponse.json({
                error: downloadError.message || 'Failed to download audio.'
            }, { status: 500 });
        }

        // 2. Transcribe
        try {
            const transcript = await transcribeAudio(audioPath);
            return NextResponse.json({ transcript });
        } catch (transcribeError: any) {
            return NextResponse.json({
                error: 'Gagal melakukan transkripsi AI.',
                details: transcribeError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[API Transcribe] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
