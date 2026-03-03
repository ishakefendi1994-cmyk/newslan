import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import FormData from 'form-data';
import os from 'os';

const execPromise = promisify(exec);

/**
 * Extract YouTube Video ID from various URL formats
 */
export function getYouTubeID(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Fetch Video Metadata
 */
export async function getYouTubeMetadata(videoID: string) {
    try {
        // Use oEmbed for basic metadata (title, thumbnail, author)
        const response = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoID}&format=json`);
        return response.data;
    } catch (error) {
        console.error('[YouTube Lib] Error fetching metadata:', error);
        return null;
    }
}

/**
 * Download Audio from YouTube using yt-dlp
 */
export async function downloadYouTubeAudio(videoID: string): Promise<string> {
    const tempDir = os.tmpdir();
    // No need to mkdirSync for os.tmpdir() as it always exists

    const outputPath = path.join(tempDir, `audio_${videoID}.mp3`);
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoID}`;

    try {
        console.log(`[YouTube Lib] Downloading audio for ${videoID}...`);
        // We use -x for extract audio, --audio-format mp3
        // --max-filesize 20M to stay within Groq's 25MB limit
        // DO NOT provide a custom User-Agent as it causes 403 errors with modern yt-dlp
        const command = `yt-dlp -x --audio-format mp3 --output "${outputPath}" --max-filesize 20M "${youtubeUrl}"`;
        await execPromise(command);

        if (fs.existsSync(outputPath)) {
            console.log(`[YouTube Lib] Audio downloaded successfully: ${outputPath}`);
            return outputPath;
        }
        throw new Error('Audio file not found after download');
    } catch (error: any) {
        console.error('[YouTube Lib] Download failed:', error);
        if (error.message?.includes('403')) {
            throw new Error('YouTube memblokir akses otomatis (403). Silakan coba jalankan "yt-dlp --cookies-from-browser chrome" di terminal Anda untuk sinkronisasi akses.');
        }
        throw error;
    }
}

/**
 * Transcribe Audio using Groq Whisper API
 */
export async function transcribeAudio(audioPath: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

    try {
        console.log(`[YouTube Lib] Transcribing audio with Whisper API...`);
        const form = new FormData();
        form.append('file', fs.createReadStream(audioPath));
        form.append('model', 'whisper-large-v3');
        form.append('response_format', 'json');

        const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${apiKey}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        // Auto-cleanup as requested by user
        try {
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
                console.log(`[YouTube Lib] Temporary audio file deleted: ${audioPath}`);
            }
        } catch (cleanupError) {
            console.warn('[YouTube Lib] Cleanup failed:', cleanupError);
        }

        return response.data.text || '';
    } catch (error: any) {
        console.error('[YouTube Lib] Transcription failed:', error);

        // Ensure cleanup even if transcription fails
        try {
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) { }

        throw error;
    }
}

/**
 * Fetch Transcript (Robust Native Scraper)
 * Works by fetching the YouTube page and extracting the caption tracks from player response.
 */
export async function getYouTubeTranscript(videoID: string): Promise<string> {
    try {
        console.log(`[YouTube Lib] Native fetching transcript for ${videoID}`);
        const url = `https://www.youtube.com/watch?v=${videoID}`;

        // Fetch the page HTML
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
            }
        });

        const html = response.data;
        const regex = /ytInitialPlayerResponse\s*=\s*({.+?});/;
        const match = html.match(regex);

        if (!match) {
            console.warn('[YouTube Lib] No player response found.');
            return '';
        }

        const json = JSON.parse(match[1]);
        const tracks = json.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!tracks || tracks.length === 0) {
            console.warn('[YouTube Lib] No caption tracks found.');
            return '';
        }

        // Prefer English or Indonesian if available. Otherwise take first.
        const track = tracks.find((t: any) => t.languageCode === 'id') ||
            tracks.find((t: any) => t.languageCode === 'en') ||
            tracks[0];

        const captionUrl = track.baseUrl + '&fmt=json3';
        console.log(`[YouTube Lib] Fetching captions from: ${track.languageCode}`);

        const captionResponse = await axios.get(captionUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com/'
            }
        });

        if (captionResponse.data && captionResponse.data.events) {
            const transcript = captionResponse.data.events
                .filter((e: any) => e.segs)
                .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
                .join(' ');

            return transcript.trim();
        }
    } catch (err: any) {
        console.warn(`[YouTube Lib] Native transcript extraction failed: ${err.message}`);
    }

    return '';
}
