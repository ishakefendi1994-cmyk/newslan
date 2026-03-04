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
$SECRET_KEY = "5oKF[T|mZb]QM%2["; // Must match NEXT_PUBLIC_TRANSCRIPTION_KEY
$TEMP_DIR = __DIR__ . "/tmp_audio";
$YTDLP_BIN = __DIR__ . "/yt-dlp"; // Check for binary in local folder first
$YTDLP_PATH = file_exists($YTDLP_BIN) ? $YTDLP_BIN : "yt-dlp"; 
$FFMPEG_PATH = "ffmpeg"; 
// ---------------------

// --- AUTO INSTALLER ---
if (isset($_GET['install']) && $_GET['install'] == '1') {
    echo "<h3>Diagnostics:</h3>";
    echo "Current User: " . get_current_user() . "<br>";
    echo "PHP Version: " . PHP_VERSION . "<br>";
    
    echo "<h4>Checking Python:</h4>";
    $pythons = ['python', 'python3', 'python3.7', 'python3.8', 'python3.9', 'python3.10', 'python3.11'];
    foreach ($pythons as $py) {
        $out = [];
        exec("$py --version 2>&1", $out, $ret);
        if ($ret === 0) echo "Found $py: " . implode(" ", $out) . "<br>";
    }

    echo "<h4>Checking Partition Execution:</h4>";
    $testFile = __DIR__ . "/test_exec.sh";
    file_put_contents($testFile, "#!/bin/sh\necho 'EXEC_OK'");
    chmod($testFile, 0755);
    exec("$testFile 2>&1", $out2, $ret2);
    if ($ret2 === 0 && implode("", $out2) === 'EXEC_OK') {
        echo "Partition allows execution: YES<br>";
    } else {
        echo "Partition allows execution: NO (Error: " . implode(" ", $out2) . ")<br>";
    }
    unlink($testFile);

    echo "<h4>Attempting Download:</h4>";
    echo "Attempting to download STANDALONE yt-dlp to: $YTDLP_BIN <br>";
    $url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";
    $content = @file_get_contents($url);
    if ($content) {
        file_put_contents($YTDLP_BIN, $content);
        chmod($YTDLP_BIN, 0755);
        echo "SUCCESS: Standalone yt-dlp downloaded and set to executable.";
    } else {
        echo "FAILED: Could not download yt-dlp. Check your server's allow_url_fopen or firewall.";
    }
    exit;
}
// ----------------------

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
$env = "export HOME=" . escapeshellarg($TEMP_DIR) . " && export TMPDIR=" . escapeshellarg($TEMP_DIR) . " && ";
$command = "{$env} {$YTDLP_PATH} -x --audio-format mp3 --output " . escapeshellarg($outputPath) . " --max-filesize 20M " . escapeshellarg($url) . " 2>&1";
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
