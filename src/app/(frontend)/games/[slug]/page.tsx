import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Gamepad2, Tag, Play, ChevronRight } from 'lucide-react'
import { getGameBySlug, getRelatedGames } from '@/lib/games'
import { getSiteSettings } from '@/lib/settings'
import GamePlayer from '@/components/games/GamePlayer'
import GameCard from '@/components/games/GameCard'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

interface GamePageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
    const { slug } = await params
    const [game, settings] = await Promise.all([getGameBySlug(slug), getSiteSettings()])
    if (!game) return { title: 'Game Not Found' }

    const siteName = settings.site_name || 'NewsLan'
    const siteUrl = settings.site_url || ''

    return {
        title: `${game.title} - Game Portal | ${siteName}`,
        description: game.description?.slice(0, 160) || `Main ${game.title} gratis di ${siteName} Game Portal!`,
        openGraph: {
            title: `${game.title} | ${siteName} Game Portal`,
            description: game.description?.slice(0, 160) || '',
            images: game.thumbnail ? [{ url: game.thumbnail }] : [],
            url: `${siteUrl}/games/${slug}`,
            type: 'website',
        },
        keywords: [...(game.tags || []), game.category, 'game html5', 'game gratis', 'main online'].join(', '),
    }
}

export default async function GameDetailPage({ params }: GamePageProps) {
    const { slug } = await params
    const [game, settings] = await Promise.all([getGameBySlug(slug), getSiteSettings()])

    if (!game) notFound()

    const relatedGames = await getRelatedGames(game.category, slug, 6)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-100 py-3">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs
                        siteUrl={settings.site_url}
                        items={[
                            { label: '🎮 Game Portal', href: '/games' },
                            { label: game.category, href: `/games?category=${game.category}` },
                            { label: game.title },
                        ]}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left — Game Player (2/3) */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Title */}
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 leading-tight">{game.title}</h1>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                    <Tag className="w-3 h-3" />
                                    {game.category}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                                    <Play className="w-3 h-3" />
                                    {game.play_count.toLocaleString('id-ID')}× dimainkan
                                </span>
                            </div>
                        </div>

                        {/* Game Player */}
                        <GamePlayer
                            embedUrl={game.embed_url}
                            title={game.title}
                            width={game.width}
                            height={game.height}
                            gameSlug={game.slug}
                        />

                        {/* Description */}
                        {game.description && (
                            <div className="bg-white rounded-2xl p-5 border border-gray-100">
                                <h2 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">Tentang Game</h2>
                                <p className="text-gray-700 text-sm leading-relaxed">{game.description}</p>
                            </div>
                        )}

                        {/* Instructions */}
                        {game.instructions && (
                            <div className="bg-white rounded-2xl p-5 border border-gray-100">
                                <h2 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3">Cara Main</h2>
                                <p className="text-gray-700 text-sm leading-relaxed">{game.instructions}</p>
                            </div>
                        )}

                        {/* Tags */}
                        {game.tags && game.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {game.tags.map((tag) => (
                                    <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right — Related Games (1/3) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" />
                                Game Serupa
                            </h2>
                            <Link
                                href={`/games?category=${game.category}`}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                Lihat semua <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {relatedGames.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                                {relatedGames.map(g => (
                                    <GameCard key={g.id} game={g} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                                <p className="text-gray-400 text-sm">Tidak ada game serupa</p>
                                <Link href="/games" className="text-indigo-600 text-sm font-bold mt-2 block">
                                    Lihat semua game →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
