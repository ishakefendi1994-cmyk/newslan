import { NextRequest, NextResponse } from 'next/server';
import { rewriteYouTubeTranscript } from '@/lib/ai/rewriter';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transcript, videoTitle, language = 'id', style = 'Professional', model = 'Straight News' } = body;

        if (!transcript) {
            return NextResponse.json({ success: false, error: 'Transcript is required' }, { status: 400 });
        }

        console.log(`[YouTube Rewrite API] Rewriting transcript for "${videoTitle}"`);

        const result = await rewriteYouTubeTranscript(
            transcript,
            videoTitle,
            language,
            style,
            model
        );

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error('[YouTube Rewrite API] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
