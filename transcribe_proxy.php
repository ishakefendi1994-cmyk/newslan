<?php
/**
 * Transcription Gateway PHP Script
 * Host this on a VPS or Shared Hosting that supports yt-dlp and ffpmeg.
 * 
 * Usage from Next.js:
 * axios.post('https://your-server.com/transcribe.php', { url: "YOUTUBE_URL", key: "SECRET_KEY" })
 */

header('Content-Type: application/json');

// --- CONFIGURATION ---
$SECRET_KEY = "Ganti_Dengan_Key_Rahasia_Anda"; // Must match NEXT_PUBLIC_TRANSCRIPTION_KEY
$YTDLP_PATH = "yt-dlp"; // Change if absolute path needed, e.g., /usr/local/bin/yt-dlp
$FFMPEG_PATH = "ffmpeg"; 
$TEMP_DIR = __DIR__ . "/tmp_audio";
$GROQ_API_KEY = "YOUR_GROQ_API_KEY"; // Or let Vercel handle transcription
// ---------------------

if (!file_exists($TEMP_DIR)) {
    mkdir($TEMP_DIR, 0777, true);
}

// 1. Validate Request
$input = json_decode(file_get_contents('php://input'), true);
$url = $input['url'] ?? null;
$key = $input['key'] ?? null;

if (!$url || $key !== $SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Unauthorized or missing URL']);
    exit;
}

// 2. Extract Video ID
preg_match('%(?:youtube(?:-nocookie)?\.com/(?:[^/]+/.+/|(?:v|e(?:mbed)?)/|.*[?&]v=)|youtu\.be/)([^"&?/ ]{11})%i', $url, $match);
$videoId = $match[1] ?? 'video';
$outputPath = $TEMP_DIR . "/audio_" . $videoId . "_" . time() . ".mp3";

// 3. Download Audio via yt-dlp
$command = "{$YTDLP_PATH} -x --audio-format mp3 --output " . escapeshellarg($outputPath) . " --max-filesize 20M " . escapeshellarg($url) . " 2>&1";
exec($command, $output, $returnVar);

if ($returnVar !== 0) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'yt-dlp failed', 
        'details' => implode("\n", $output)
    ]);
    exit;
}

if (!file_exists($outputPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Audio file not generated']);
    exit;
}

// 4. Return Audio Data (Base64) or Success
// To avoid big memory usage, we just return the confirmation and Vercel can fetch the file
// Or for simplicity, we send back Base64 if small.
$audioData = base64_encode(file_get_contents($outputPath));
unlink($outputPath); // Clean up

echo json_encode([
    'success' => true,
    'audio_base64' => $audioData,
    'format' => 'mp3'
]);
