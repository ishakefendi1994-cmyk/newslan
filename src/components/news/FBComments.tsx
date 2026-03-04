'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface FBCommentsProps {
    url: string
    numPosts?: number
    orderBy?: 'reverse_time' | 'time' | 'social'
}

export default function FBComments({ url, numPosts = 10, orderBy = 'social' }: FBCommentsProps) {
    useEffect(() => {
        // Parse FB Comments whenever the URL changes or SDK loads
        const parseFB = () => {
            if (typeof window !== 'undefined' && (window as any).FB) {
                try {
                    (window as any).FB.XFBML.parse();
                } catch (err) {
                    console.error('FB XFBML parse error:', err);
                }
            }
        };

        parseFB();
        // Also try after a short delay to be safe
        const timer = setTimeout(parseFB, 1000);
        return () => clearTimeout(timer);
    }, [url]);

    // Ensure we have an absolute URL for Facebook
    const getAbsoluteUrl = () => {
        if (typeof window === 'undefined') return url;
        try {
            // If it's already absolute, return it
            if (url.startsWith('http')) return url;
            // Otherwise, combine with current origin
            return window.location.origin + url;
        } catch (e) {
            return typeof window !== 'undefined' ? window.location.href : url;
        }
    }

    const absoluteUrl = getAbsoluteUrl();

    return (
        <div className="w-full bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mt-12 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 bg-[#1877F2] rounded-full" />
                <h3 className="font-bold text-gray-900 uppercase tracking-tight">Komentar Pembaca</h3>
            </div>

            <div className="fb-comments-container w-full min-h-[200px] overflow-hidden">
                <div
                    key={absoluteUrl} // Re-render when URL changes to force FB to re-parse
                    className="fb-comments"
                    data-href={absoluteUrl}
                    data-width="100%"
                    data-numposts={numPosts}
                    data-order-by={orderBy}
                ></div>
            </div>

            {/* Facebook SDK */}
            <div id="fb-root"></div>
            <Script
                async
                defer
                crossOrigin="anonymous"
                src="https://connect.facebook.net/id_ID/sdk.js#xfbml=1&version=v17.0"
                strategy="afterInteractive"
                onLoad={() => {
                    if ((window as any).FB) {
                        (window as any).FB.XFBML.parse();
                    }
                }}
            />
        </div>
    )
}
