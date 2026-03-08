'use client'

import { useRef, useState } from 'react'
import { Maximize2, RefreshCw, Loader2 } from 'lucide-react'

interface GamePlayerProps {
    embedUrl: string
    title: string
    width: number
    height: number
    gameSlug: string
}

export default function GamePlayer({ embedUrl, title, width, height, gameSlug }: GamePlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [loading, setLoading] = useState(true)
    const [key, setKey] = useState(0)

    const aspectRatio = height && width ? (height / width) * 100 : 56.25

    const handleFullscreen = () => {
        const el = containerRef.current as any
        const doc = document as any

        if (!el) return

        const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement

        if (isFullscreen) {
            if (doc.exitFullscreen) doc.exitFullscreen()
            else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen()
            else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen()
            else if (doc.msExitFullscreen) doc.msExitFullscreen()
        } else {
            if (el.requestFullscreen) el.requestFullscreen()
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
            else if (el.mozRequestFullScreen) el.mozRequestFullScreen()
            else if (el.msRequestFullscreen) el.msRequestFullscreen()
        }
    }

    const handleReload = () => {
        setLoading(true)
        setKey(prev => prev + 1)
        // Increment play count silently
        fetch(`/api/games/${gameSlug}/play`, { method: 'POST' }).catch(() => { })
    }

    return (
        <div className="w-full">
            <div
                ref={containerRef}
                className="relative w-full rounded-2xl overflow-hidden bg-gray-950 shadow-2xl group"
                style={{ paddingBottom: `${Math.min(Math.max(aspectRatio, 50), 80)}%` }}
            >
                {/* Loading overlay */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                            <p className="text-gray-400 text-sm">Memuat game...</p>
                        </div>
                    </div>
                )}

                {/* Game iframe */}
                <iframe
                    key={key}
                    ref={iframeRef}
                    src={embedUrl}
                    title={title}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    allow="autoplay; fullscreen; payment"
                    onLoad={() => setLoading(false)}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock allow-top-navigation"
                />

                {/* Control buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-20">
                    <button
                        onClick={handleReload}
                        title="Reload game"
                        className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleFullscreen}
                        title="Fullscreen"
                        className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
