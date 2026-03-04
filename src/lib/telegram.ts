import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string, extra: any = {}): Promise<number | null> {
    try {
        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            ...extra
        });
        return response.data?.result?.message_id || null;
    } catch (error: any) {
        console.error('[Telegram Lib] Error sending message:', error.response?.data || error.message);
        return null;
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

import { createClient } from './supabase/server';

interface ArticleDraft {
    title: string;
    content: string;
    excerpt: string;
    videoId: string;
}

/**
 * Save article draft to Supabase telegram_drafts table
 */
export async function saveDraft(chatId: number, draft: ArticleDraft): Promise<string> {
    const supabase = await createClient();
    const draftId = `${chatId}_${Date.now().toString().slice(-6)}`;

    const { error } = await supabase.from('telegram_drafts').insert({
        id: draftId,
        chat_id: chatId,
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
        video_id: draft.videoId
    });

    if (error) {
        console.error('[Telegram Lib] Error saving draft to DB:', error);
        throw error;
    }

    return draftId;
}

/**
 * Get article draft from Supabase
 */
export async function getDraft(draftId: string): Promise<ArticleDraft | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('telegram_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

    if (error || !data) {
        console.error('[Telegram Lib] Error fetching draft from DB:', error);
        return null;
    }

    return {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        videoId: data.video_id
    };
}

/**
 * Delete article draft from Supabase
 */
export async function deleteDraft(draftId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('telegram_drafts')
        .delete()
        .eq('id', draftId);

    if (error) {
        console.warn('[Telegram Lib] Error deleting draft from DB:', error);
    }
}
