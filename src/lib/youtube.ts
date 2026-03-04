import axios from 'axios';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import FormData from 'form-data';
import os from 'os';
import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from '@distube/ytdl-core';

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
 * Get YouTube Transcript directly (no audio download needed!)
 * Works for videos that have subtitles (auto-generated or manual).
 * Tries Indonesian first, then English as fallback.
 */
export async function getYouTubeTranscript(videoID: string): Promise<string | null> {
    try {
        console.log(`[YouTube Lib] Fetching transcript for ${videoID}...`);

        // Try Indonesian first, then English
        let transcriptItems = null;
        const langs = ['id', 'en'];

        for (const lang of langs) {
            try {
                transcriptItems = await YoutubeTranscript.fetchTranscript(videoID, { lang });
                if (transcriptItems && transcriptItems.length > 0) {
                    console.log(`[YouTube Lib] Transcript found in lang: ${lang}`);
                    break;
                }
            } catch (e) {
                // Try next language
            }
        }

        // If specific langs failed, try without lang preference
        if (!transcriptItems || transcriptItems.length === 0) {
            transcriptItems = await YoutubeTranscript.fetchTranscript(videoID);
        }

        if (!transcriptItems || transcriptItems.length === 0) {
            return null;
        }

        const text = transcriptItems.map((t: any) => t.text).join(' ');
        console.log(`[YouTube Lib] Transcript fetched successfully. Length: ${text.length} chars`);
        return text;

    } catch (err: any) {
        console.warn('[YouTube Lib] YoutubeTranscript failed:', err.message);
        return null;
    }
}

/**
 * Stream YouTube audio in-memory and send directly to Groq Whisper.
 * No yt-dlp, no ffmpeg, no file writes needed — pure Node.js buffer streaming.
 */
export async function transcribeFromYouTubeURL(videoID: string): Promise<string> {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoID}`;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

    console.log(`[YouTube Lib] Streaming audio in-memory for ${videoID}...`);

    try {
        // Check if video is accessible
        if (!ytdl.validateID(videoID)) {
            throw new Error('Invalid YouTube Video ID');
        }

        const info = await ytdl.getInfo(youtubeUrl);

        // Get audio-only format
        const audioFormat = ytdl.chooseFormat(info.formats, {
            quality: 'lowestaudio',
            filter: 'audioonly'
        });

        if (!audioFormat) {
            throw new Error('No audio format found for this video');
        }

        // Collect audio chunks in memory as Buffer
        const audioBuffer: Buffer = await new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const stream = ytdl.downloadFromInfo(info, { format: audioFormat });

            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', (err) => reject(err));

            // Limit to 15MB to avoid memory issues on serverless
            let totalBytes = 0;
            stream.on('data', (chunk: Buffer) => {
                totalBytes += chunk.length;
                if (totalBytes > 15 * 1024 * 1024) {
                    stream.destroy();
                    resolve(Buffer.concat(chunks));
                }
            });
        });

        console.log(`[YouTube Lib] Audio buffered: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`);

        // Send to Groq Whisper
        const form = new FormData();
        form.append('file', audioBuffer, {
            filename: `audio_${videoID}.webm`,
            contentType: audioFormat.mimeType || 'audio/webm',
        });
        form.append('model', 'whisper-large-v3-turbo');
        form.append('language', 'id');
        form.append('response_format', 'text');

        const whisperResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
            headers: { ...form.getHeaders(), 'Authorization': `Bearer ${apiKey}` },
            timeout: 120000,
        });

        const transcript = typeof whisperResponse.data === 'string'
            ? whisperResponse.data
            : whisperResponse.data?.text || '';

        console.log(`[YouTube Lib] In-memory transcription success! Length: ${transcript.length}`);
        return transcript;

    } catch (err: any) {
        console.error('[YouTube Lib] In-memory transcription failed:', err.message);
        throw err;
    }
}

/**
 * Full transcription via External PHP Gateway.
 * Handles both direct transcript (via youtube-transcript-api) and audio (via yt-dlp + Whisper).
 */
export async function transcribeViaGateway(videoID: string): Promise<string | null> {
    const gatewayUrl = process.env.EXTERNAL_TRANSCRIPTION_API;
    const gatewayKey = process.env.EXTERNAL_TRANSCRIPTION_KEY;
    if (!gatewayUrl || !gatewayKey) return null;

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoID}`;
    console.log(`[YouTube Lib] Calling PHP Gateway for ${videoID}...`);

    const response = await axios.post(gatewayUrl, { url: youtubeUrl, key: gatewayKey }, { timeout: 120000 });

    if (!response.data?.success) {
        throw new Error(response.data?.error || 'Gateway returned failure');
    }

    // Case 1: Gateway returned transcript directly (from youtube-transcript-api)
    if (response.data.transcript) {
        console.log(`[YouTube Lib] Gateway returned transcript (${response.data.method}). Length: ${response.data.transcript.length}`);
        return response.data.transcript;
    }

    // Case 2: Gateway returned audio (from yt-dlp) → send to Whisper
    if (response.data.audio_base64) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY not configured');

        console.log('[YouTube Lib] Gateway returned audio, sending to Whisper...');
        const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');

        const form = new FormData();
        form.append('file', audioBuffer, {
            filename: `audio_${videoID}.mp3`,
            contentType: 'audio/mpeg',
        });
        form.append('model', 'whisper-large-v3-turbo');
        form.append('language', 'id');
        form.append('response_format', 'text');

        const whisperResponse = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
            headers: { ...form.getHeaders(), 'Authorization': `Bearer ${apiKey}` },
            timeout: 120000,
        });

        const transcript = typeof whisperResponse.data === 'string'
            ? whisperResponse.data
            : whisperResponse.data?.text || '';

        console.log(`[YouTube Lib] Gateway + Whisper success! Length: ${transcript.length}`);
        return transcript;
    }

    return null;
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


