import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string, extra: any = {}) {
    try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            ...extra
        });
    } catch (error: any) {
        console.error('[Telegram Lib] Error sending message:', error.response?.data || error.message);
    }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
    try {
        await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId,
            text
        });
    } catch (error: any) {
        console.error('[Telegram Lib] Error answering callback:', error.response?.data || error.message);
    }
}

export async function editMessageText(chatId: number, messageId: number, text: string, extra: any = {}) {
    try {
        await axios.post(`${TELEGRAM_API}/editMessageText`, {
            chat_id: chatId,
            message_id: messageId,
            text,
            parse_mode: 'HTML',
            ...extra
        });
    } catch (error: any) {
        console.error('[Telegram Lib] Error editing message:', error.response?.data || error.message);
    }
}

interface ArticleDraft {
    title: string;
    content: string;
    excerpt: string;
    videoId: string;
}

const DRAFT_DIR = path.join(os.tmpdir(), 'telegram_drafts');

export function saveDraft(chatId: number, draft: ArticleDraft): string {
    if (!fs.existsSync(DRAFT_DIR)) {
        fs.mkdirSync(DRAFT_DIR, { recursive: true });
    }

    // Use a short ID (last 8 of videoId + timestamp)
    const draftId = `${chatId}_${Date.now().toString().slice(-6)}`;
    const filePath = path.join(DRAFT_DIR, `${draftId}.json`);

    fs.writeFileSync(filePath, JSON.stringify(draft, null, 2));
    return draftId;
}

export function getDraft(draftId: string): ArticleDraft | null {
    const filePath = path.join(DRAFT_DIR, `${draftId}.json`);
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    return null;
}

export function deleteDraft(draftId: string) {
    const filePath = path.join(DRAFT_DIR, `${draftId}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
