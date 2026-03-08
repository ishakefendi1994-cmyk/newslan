import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { Gamepad2, Tag, Play, ChevronRight } from 'lucide-react'
import { getGameBySlug, getRelatedGames } from '@/lib/games'
import { getSiteSettings } from '@/lib/settings'
import GamePlayer from '@/components/games/GamePlayer'
import GameCard from '@/components/games/GameCard'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { createClient } from '@/lib/supabase/server'
import AdRenderer from '@/components/news/AdRenderer'

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
    const supabase = await createClient()
    const [game, settings, { data: bottomAd }, { data: leftAds }] = await Promise.all([
        getGameBySlug(slug),
        getSiteSettings(),
        supabase.from('advertisements').select('*').eq('placement', 'game_bottom').eq('is_active', true).limit(1).maybeSingle(),
        supabase.from('advertisements').select('*').eq('placement', 'game_sidebar_left').eq('is_active', true)
    ])

    if (!game) notFound()

    const relatedGames = await getRelatedGames(game.category, slug, 6)

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#4a00e0] via-[#8e2de2] to-[#2b0057] text-white pb-16">
            {/* Breadcrumb */}
            <div className="bg-white/5 border-b border-white/10 py-3 backdrop-blur-md">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs
                        siteUrl={settings.site_url}
                        theme="dark"
                        items={[
                            { label: '🎮 Game Portal', href: '/games' },
                            { label: game.category, href: `/games?category=${game.category}` },
                            { label: game.title },
                        ]}
                    />
                </div>
            </div>

            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                    {/* Left Sidebar (Ads) */}
                    <div className="hidden xl:flex w-[250px] shrink-0 flex-col gap-8 sticky top-24">
                        {leftAds && leftAds.length > 0 ? (
                            leftAds.map((ad) => (
                                <div key={ad.id} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-center overflow-hidden">
                                    <AdRenderer ad={ad} className="w-full" isSidebar={true} />
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-[600px] bg-white/5 rounded-2xl border border-white/10 border-dashed flex items-center justify-center text-white/30 text-xs font-black tracking-widest uppercase">
                                Ad Space
                            </div>
                        )}
                    </div>

                    {/* Center — Game Player */}
                    <div className="flex-1 min-w-0 space-y-5">
                        {/* Title */}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{game.title}</h1>
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

                        {/* Bottom Ad */}
                        {bottomAd && (
                            <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-center overflow-hidden">
                                <AdRenderer ad={bottomAd} className="max-w-full" />
                            </div>
                        )}

                        {/* Description */}
                        {game.description && (
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                                <h2 className="text-sm font-black uppercase tracking-wider text-purple-200 mb-3">Tentang Game</h2>
                                <p className="text-purple-50 text-sm leading-relaxed">{game.description}</p>
                            </div>
                        )}

                        {/* Instructions */}
                        {game.instructions && (
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                                <h2 className="text-sm font-black uppercase tracking-wider text-purple-200 mb-3">Cara Main</h2>
                                <p className="text-purple-50 text-sm leading-relaxed">{game.instructions}</p>
                            </div>
                        )}

                        {/* Tags */}
                        {game.tags && game.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {game.tags.map((tag) => (
                                    <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-medium border border-white/5">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar — Related Games */}
                    <div className="w-full xl:w-[250px] shrink-0 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wider text-purple-200 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" />
                                Game Serupa
                            </h2>
                            <Link
                                href={`/games?category=${game.category}`}
                                className="text-xs font-bold text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1"
                            >
                                Lihat semua <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>

                        {relatedGames.length > 0 ? (
                            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
                                {relatedGames.map(g => (
                                    <GameCard key={g.id} game={g} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10">
                                <p className="text-purple-200/60 text-sm">Tidak ada game serupa</p>
                                <Link href="/games" className="text-fuchsia-300 text-sm font-bold mt-2 block">
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
