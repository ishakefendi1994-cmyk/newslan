import { Suspense } from 'react'
import { Metadata } from 'next'
import { Gamepad2, Zap, Tag, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getGames as fetchGames, getFeaturedGames as fetchFeatured, GAME_CATEGORIES } from '@/lib/games'
import GameCard from '@/components/games/GameCard'
import GameCategoryFilter from '@/components/games/GameCategoryFilter'
import { Pagination } from '@/components/ui/Pagination'
import { getSiteSettings } from '@/lib/settings'
import { createClient } from '@/lib/supabase/server'
import AdRenderer from '@/components/news/AdRenderer'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
    const s = await getSiteSettings()
    return {
        title: `Game Portal - ${s.site_name || 'NewsLan'}`,
        description: 'Kumpulan game HTML5 terbaik gratis. Mainkan langsung di browser, tanpa download!',
        openGraph: {
            title: `Game Portal - ${s.site_name || 'NewsLan'}`,
            description: 'Kumpulan game HTML5 terbaik gratis.',
        },
    }
}

interface GamesPageProps {
    searchParams: Promise<{ category?: string; page?: string; search?: string }>
}

const ITEMS_PER_PAGE = 24

export default async function GamesPage({ searchParams }: GamesPageProps) {
    const params = await searchParams
    const category = params.category || 'All'
    const settings = await getSiteSettings()
    const page = parseInt(params.page || '1')
    const search = params.search || ''

    const supabase = await createClient()

    const isMainLanding = category === 'All' && !search && page === 1;

    const categoryPromises = isMainLanding
        ? GAME_CATEGORIES.filter(c => c !== 'All').map(async (cat) => {
            const { data } = await supabase
                .from('games')
                .select('*')
                .eq('is_active', true)
                .ilike('category', `%${cat}%`)
                .order('is_featured', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(10);
            return { category: cat, items: data || [] };
        })
        : [];

    const [
        { data: games, count },
        featuredGames,
        { data: leftAds },
        { data: rightAds },
        ...categorySectionsRaw
    ] = await Promise.all([
        fetchGames({ category, page, limit: ITEMS_PER_PAGE, search }),
        fetchFeatured(4),
        supabase.from('advertisements').select('*').eq('placement', 'game_sidebar_left').eq('is_active', true),
        supabase.from('advertisements').select('*').eq('placement', 'game_sidebar_right').eq('is_active', true),
        ...categoryPromises
    ])

    const categorySections = categorySectionsRaw as { category: string, items: any[] }[];

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#4a00e0] via-[#8e2de2] to-[#2b0057] text-white pb-16">
            {/* Hero */}
            <div className="text-white">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-500/30 flex items-center justify-center mb-4">
                            <Gamepad2 className="w-8 h-8 text-indigo-300" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Game Portal</h1>
                        <p className="text-indigo-200 text-sm md:text-base max-w-lg">Ratusan game HTML5 gratis — langsung main di browser!</p>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center items-center gap-8 md:gap-12 mt-8">
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">{count?.toLocaleString('id-ID') || '0'}</p>
                            <p className="text-xs text-indigo-300 uppercase tracking-widest mt-1">Total Game</p>
                        </div>
                        <div className="h-10 w-px bg-indigo-500/30" />
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">{GAME_CATEGORIES.length - 1}</p>
                            <p className="text-xs text-indigo-300 uppercase tracking-widest mt-1">Kategori</p>
                        </div>
                        <div className="h-10 w-px bg-indigo-500/30" />
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">100%</p>
                            <p className="text-xs text-indigo-300 uppercase tracking-widest mt-1">Gratis</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Featured Games (only on page 1, no filter) */}
                {featuredGames.length > 0 && page === 1 && category === 'All' && !search && (
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-lg font-black uppercase tracking-tight">Game Unggulan</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                            {featuredGames.map(game => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Filter & Search */}
                <div className="mb-6 space-y-3">
                    <Suspense fallback={<div className="h-10" />}>
                        <GameCategoryFilter activeCategory={category} />
                    </Suspense>
                </div>

                {/* Game Count */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-purple-100/70">
                        {search
                            ? `${count} game ditemukan untuk "${search}"`
                            : category !== 'All'
                                ? `${count} game dalam kategori ${category}`
                                : `${count} game tersedia`
                        }
                    </p>
                </div>

                {/* Layout with Sidebars */}
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                    {/* Left Sidebar */}
                    <div className="w-full xl:w-[300px] shrink-0 flex flex-col gap-8 xl:sticky xl:top-24">
                        {leftAds && leftAds.length > 0 ? (
                            leftAds.map((ad) => (
                                <div key={ad.id} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-center overflow-hidden">
                                    <AdRenderer ad={ad} isSidebar={true} className="w-full" />
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-[600px] bg-white/5 rounded-2xl border border-white/10 border-dashed flex items-center justify-center text-white/30 text-xs font-black tracking-widest uppercase">
                                Ad Space
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {isMainLanding ? (
                            <div className="space-y-10">
                                {categorySections.filter(section => section.items.length > 0).map(section => (
                                    <div key={section.category} className="space-y-4">
                                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                                    <Tag className="w-4 h-4 text-purple-300" />
                                                </div>
                                                <h2 className="text-xl font-black uppercase tracking-tight">{section.category}</h2>
                                            </div>
                                            <Link href={`/games?category=${section.category}`} className="text-xs font-bold text-fuchsia-300 hover:text-white transition-colors flex items-center gap-1">
                                                LIHAT SEMUA <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                                            {section.items.map(game => (
                                                <GameCard key={game.id} game={game} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : games.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                                {games.map(game => (
                                    <GameCard key={game.id} game={game} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 bg-white/5 backdrop-blur-md rounded-3xl border-2 border-dashed border-white/20">
                                <Gamepad2 className="w-12 h-12 text-white/30 mb-4" />
                                <h3 className="text-xl font-black text-white/50 uppercase tracking-tighter">Belum Ada Game</h3>
                                <p className="text-white/40 text-sm mt-1">Sync game dari panel admin untuk mulai.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {!isMainLanding && totalPages > 1 && (
                            <div className="mt-10">
                                <Pagination
                                    currentPage={page}
                                    totalPages={totalPages}
                                    baseUrl={`/games${category !== 'All' ? `?category=${category}` : ''}`}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full xl:w-[300px] shrink-0 flex flex-col gap-8 xl:sticky xl:top-24">
                        {rightAds && rightAds.length > 0 ? (
                            rightAds.map((ad) => (
                                <div key={ad.id} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex justify-center overflow-hidden">
                                    <AdRenderer ad={ad} isSidebar={true} className="w-full" />
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-[600px] bg-white/5 rounded-2xl border border-white/10 border-dashed flex items-center justify-center text-white/30 text-xs font-black tracking-widest uppercase">
                                Ad Space
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
