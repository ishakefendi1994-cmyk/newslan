'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Gamepad2 } from 'lucide-react'
import type { Game } from '@/lib/games'

interface GameCardProps {
    game: Game
}

export default function GameCard({ game }: GameCardProps) {
    return (
        <Link
            href={`/games/${game.slug}`}
            className="group relative flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
        >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
                {game.thumbnail ? (
                    <Image
                        src={game.thumbnail}
                        alt={game.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Gamepad2 className="w-12 h-12 text-gray-600" />
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 text-gray-900 fill-gray-900 ml-1" />
                    </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-black/60 text-white backdrop-blur-sm">
                        {game.category}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="p-3 flex-1 flex flex-col gap-1">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {game.title}
                </h3>
                {game.play_count > 0 && (
                    <p className="text-xs text-gray-400 mt-auto">
                        {game.play_count.toLocaleString('id-ID')}× dimainkan
                    </p>
                )}
            </div>
        </Link>
    )
}
