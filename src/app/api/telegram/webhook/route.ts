import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeID, transcribeFromYouTubeURL, getYouTubeMetadata, getYouTubeTranscript } from '@/lib/youtube';
import { rewriteYouTubeTranscript } from '@/lib/ai/rewriter';
import { sendMessage, editMessageText, answerCallbackQuery, saveDraft, getDraft, deleteDraft } from '@/lib/telegram';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Handle Callback Query (Category Selection)
        if (body.callback_query) {
            return await handleCallbackQuery(body.callback_query);
        }

        // Handle Message
        if (body.message && body.message.text) {
            return await handleMessage(body.message);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[Telegram Webhook] Error:', error);
        return NextResponse.json({ ok: true });
    }
}

async function handleMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;

    const videoId = getYouTubeID(text);
    if (!videoId) {
        if (text === '/start') {
            await sendMessage(chatId, '👋 <b>Halo!</b>\n\nKirimkan link YouTube untuk mengubahnya menjadi berita secara otomatis menggunakan Whisper AI.');
        }
        return NextResponse.json({ ok: true });
    }

    await sendMessage(chatId, '🛠 <b>Sistem Mendeteksi Link YouTube.</b>\nSedang mengambil transkrip...');

    try {
        // 1. Metadata
        const metadata = await getYouTubeMetadata(videoId);
        const title = metadata?.title || 'Video Tanpa Judul';

        // 2. Transcribe
        let transcript = '';
        try {
            console.log(`[Telegram Bot] Attempting native scraping for ${videoId}`);
            const result = await getYouTubeTranscript(videoId);
            if (result) transcript = result;
        } catch (scrapeError) {
            console.warn('[Telegram Bot] Native scraping failed, will try Whisper.', scrapeError);
        }

        // Fallback to Whisper in-memory (no yt-dlp, no file writes!)
        if (!transcript) {
            try {
                transcript = await transcribeFromYouTubeURL(videoId);
            } catch (whisperError) {
                console.error('[Telegram Bot] Whisper in-memory failed:', whisperError);
            }
        }

        if (!transcript) {
            await sendMessage(chatId, '❌ Gagal mengekstrak transkrip dari video ini (Metode Scraping & Whisper gagal).');
            return NextResponse.json({ ok: true });
        }

        await sendMessage(chatId, '✍️ <b>Transkrip Berhasil Didapatkan.</b>\nSedang menulis ulang menjadi berita...');

        // 3. Rewrite
        const news = await rewriteYouTubeTranscript(transcript, title, 'id', 'Professional', 'Straight News');

        // 4. Save Draft to Supabase Table
        const draftId = await saveDraft(chatId, {
            title: news.title,
            content: news.content,
            excerpt: news.excerpt,
            videoId: videoId
        });

        // 5. Get Categories
        const supabase = await createClient();
        const { data: categories } = await supabase.from('categories').select('id, name');

        const keyboard = {
            inline_keyboard: categories?.map(cat => ([{
                text: cat.name,
                callback_data: `pub:${cat.id}:${draftId}` // pub:CAT_ID:DRAFT_ID
            }])) || []
        };

        await sendMessage(chatId, `📰 <b>DRAFT BERITA BERHASIL DIBUAT:</b>\n\n<b>${news.title}</b>\n\n${news.excerpt}\n\n<i>Silakan pilih kategori di bawah untuk mempublikasikan artikel ini ke website:</i>`, {
            reply_markup: keyboard
        });

    } catch (err: any) {
        await sendMessage(chatId, `❌ Terjadi kesalahan: ${err.message}`);
    }

    return NextResponse.json({ ok: true });
}

async function handleCallbackQuery(callback: any) {
    const callbackData = callback.data;
    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id;

    if (callbackData.startsWith('pub:')) {
        const [_, categoryId, draftId] = callbackData.split(':');

        await answerCallbackQuery(callback.id, 'Mempublikasikan artikel...');

        const draft = await getDraft(draftId);
        if (!draft) {
            await editMessageText(chatId, messageId, '❌ Draft sudah kadaluarsa atau tidak ditemukan di database.');
            return NextResponse.json({ ok: true });
        }

        try {
            const supabase = await createClient();

            // Generate slug
            const slug = draft.title.toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 7);

            // Get first admin as author
            const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();

            const { error: insertError } = await supabase.from('articles').insert({
                title: draft.title,
                slug: slug,
                content: draft.content,
                excerpt: draft.excerpt,
                category_id: categoryId,
                author_id: admin?.id,
                is_published: true,
                featured_image: `https://img.youtube.com/vi/${draft.videoId}/maxresdefault.jpg`
            });

            if (insertError) throw insertError;

            await editMessageText(chatId, messageId, `✅ <b>Berhasil Dipublikasikan!</b>\n\nJudul: ${draft.title}\nKategori: Terpilih\n\nLihat di website: ${process.env.NEXT_PUBLIC_SITE_URL}/news/${slug}`);

            await deleteDraft(draftId);
        } catch (err: any) {
            await sendMessage(chatId, `❌ Gagal menyimpan ke database: ${err.message}`);
        }
    }

    return NextResponse.json({ ok: true });
}
