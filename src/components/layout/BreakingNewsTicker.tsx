'use client'

import { Zap } from 'lucide-react'

interface BreakingNewsTickerProps {
    news?: string[]
}

export function BreakingNewsTicker({ news = [] }: BreakingNewsTickerProps) {
    // Fallback news if none provided
    const displayNews = news.length > 0 ? news : [
        "Terpercaya, Newslan.id - Edukasi, Investigasi dan Terpercaya",
        "Ikuti terus perkembangan berita terbaru hanya di NEWSLAN.ID",
    ]

    return (
        <div className="bg-primary text-white py-2 border-y border-white/10 overflow-hidden relative group">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center relative">
                {/* Badge Label */}
                <div className="flex items-center space-x-2 bg-white text-primary px-3 py-1 rounded-sm mr-6 shrink-0 relative z-10 shadow-[4px_0_10px_rgba(0,0,0,0.1)]">
                    <Zap className="w-4 h-4 fill-current" />
                    <span className="text-xs font-black uppercase italic tracking-tighter">News Flash</span>
                </div>

                {/* Marquee Container */}
                <div className="flex-1 overflow-hidden pointer-events-none">
                    <div className="flex whitespace-nowrap animate-marquee pointer-events-auto">
                        {displayNews.map((item, i) => (
                            <span key={i} className="mx-8 text-xs font-bold text-white uppercase tracking-tight hover:text-white/80 transition-colors">
                                {item}
                            </span>
                        ))}
                        {/* Duplicate for seamless loop */}
                        {displayNews.map((item, i) => (
                            <span key={`dup-${i}`} className="mx-8 text-xs font-bold text-white uppercase tracking-tight">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Optional: Right side indicator or gradient fade */}
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none" />
            </div>
        </div>
    );
}
