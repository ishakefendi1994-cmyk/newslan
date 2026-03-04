import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import FormData from 'form-data';
import os from 'os';

import { createClient } from './supabase/server';

const execPromise = promisify(exec);

/**
 * Upload audio to Supabase Storage (news-audio bucket)
 */
async function uploadAudioToSupabase(filePath: string, videoID: string): Promise<string> {
    try {
        const supabase = await createClient();
        const fileContent = fs.readFileSync(filePath);
        const fileName = `${videoID}_${Date.now()}.mp3`;

        const { data, error } = await supabase.storage
            .from('news-audio')
            .upload(fileName, fileContent, {
                contentType: 'audio/mpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('news-audio')
            .getPublicUrl(fileName);

        console.log(`[YouTube Lib] Audio uploaded to Supabase: ${publicUrl}`);
        return publicUrl;
    } catch (err: any) {
        console.error('[YouTube Lib] Error uploading to Supabase:', err.message);
        throw err;
    }
}

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

    // -------------------------------------------------------------------------
    // 1. External Gateway Support (Recommended for Vercel)
    // -------------------------------------------------------------------------
    const gatewayUrl = process.env.EXTERNAL_TRANSCRIPTION_API;
    const gatewayKey = process.env.EXTERNAL_TRANSCRIPTION_KEY;

    if (gatewayUrl && gatewayKey) {
        try {
            console.log(`[YouTube Lib] Using External Gateway for audio: ${gatewayUrl}`);
            const response = await axios.post(gatewayUrl, {
                url: youtubeUrl,
                key: gatewayKey
            });

            if (response.data?.success && response.data?.audio_base64) {
                const buffer = Buffer.from(response.data.audio_base64, 'base64');
                fs.writeFileSync(outputPath, buffer);
                console.log(`[YouTube Lib] Audio received from Gateway and saved to ${outputPath}`);
                return outputPath;
            }
        } catch (gatewayErr: any) {
            console.warn('[YouTube Lib] External Gateway failed:', gatewayErr.message);
            if (gatewayErr.response?.data?.error) {
                const details = gatewayErr.response.data.details || '';
                throw new Error(`Gateway Error: ${gatewayErr.response.data.error}. ${details}`);
            }
            // If it's a connection error and no custom error from gateway, maybe fallback or throw
            throw new Error(`Gagal terhubung ke Transcription Gateway: ${gatewayErr.message}`);
        }
    }

    // -------------------------------------------------------------------------
    // 2. Local yt-dlp Support (Legacy/Fallback)
    // -------------------------------------------------------------------------
    const localBinPath = path.join(process.cwd(), 'bin', 'yt-dlp');
    let ytDlpCommand = 'yt-dlp';

    // Use local binary if it exists (for Vercel/Cloud)
    if (fs.existsSync(localBinPath)) {
        console.log(`[YouTube Lib] Using local yt-dlp binary at ${localBinPath}`);
        // Ensure it's executable (if on Linux)
        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(localBinPath, '755');
            } catch (e) {
                console.warn('[YouTube Lib] Failed to chmod local binary:', e);
            }
        }
        ytDlpCommand = `"${localBinPath}"`;
    }

    try {
        console.log(`[YouTube Lib] Downloading audio for ${videoID}...`);

        let ffmpegArgs = '';
        try {
            const ffmpeg = require('ffmpeg-static');
            if (ffmpeg) {
                console.log(`[YouTube Lib] Using ffmpeg-static at ${ffmpeg}`);
                ffmpegArgs = `--ffmpeg-location "${ffmpeg}"`;
            }
        } catch (e) {
            console.warn('[YouTube Lib] ffmpeg-static not found or error loading:', e);
        }

        const command = `${ytDlpCommand} ${ffmpegArgs} -x --audio-format mp3 --output "${outputPath}" --max-filesize 20M "${youtubeUrl}"`;

        const { stdout, stderr } = await execPromise(command);
        if (stdout) console.log(`[YouTube Lib] yt-dlp stdout: ${stdout}`);
        if (stderr) console.warn(`[YouTube Lib] yt-dlp stderr: ${stderr}`);

        if (fs.existsSync(outputPath)) {
            console.log(`[YouTube Lib] Audio downloaded successfully: ${outputPath}`);
            return outputPath;
        } else {
            console.error(`[YouTube Lib] File NOT found at ${outputPath} after command execution.`);
            // List files in tempDir for debugging
            try {
                const files = fs.readdirSync(tempDir);
                console.log(`[YouTube Lib] Files in ${tempDir}:`, files);
            } catch (e) { }
            throw new Error('Audio file not found after download');
        }
    } catch (error: any) {
        console.error('[YouTube Lib] Download failed:', error.message);
        if (error.stdout) console.log(`[YouTube Lib] Error stdout: ${error.stdout}`);
        if (error.stderr) console.error(`[YouTube Lib] Error stderr: ${error.stderr}`);
        if (error.message?.includes('403')) {
            throw new Error('YouTube memblokir akses otomatis (403). Silakan coba jalankan "yt-dlp --cookies-from-browser chrome" di terminal Anda untuk sinkronisasi akses.');
        }
        throw error;
    }
}

/**
 * Transcribe Audio using Groq Whisper API
 */
export async function transcribeAudio(audioPath: string, videoID: string): Promise<string> {
    try {
        console.log(`[YouTube Lib] Transcribing audio with Whisper: ${audioPath}`);

        // 1. Upload to Supabase as a relay for stability (optional but useful for tracking)
        // Note: For now we'll upload, but still send the local file stream to Groq 
        // because Whisper API expects a direct file stream or Buffer.
        try {
            await uploadAudioToSupabase(audioPath, videoID);
        } catch (uploadErr) {
            console.warn('[YouTube Lib] Supabase upload failed, proceeding with local file for Groq:', uploadErr);
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

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
