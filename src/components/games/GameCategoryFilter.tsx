'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { GAME_CATEGORIES } from '@/lib/game-constants'

interface GameCategoryFilterProps {
    activeCategory: string
}

export default function GameCategoryFilter({ activeCategory }: GameCategoryFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleCategoryChange = (cat: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (cat === 'All') {
            params.delete('category')
        } else {
            params.set('category', cat)
        }
        params.delete('page')
        router.push(`/games?${params.toString()}`)
    }

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {GAME_CATEGORIES.map((cat) => {
                const isActive = cat === activeCategory || (cat === 'All' && activeCategory === 'All')
                return (
                    <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                )
            })}
        </div>
    )
}
