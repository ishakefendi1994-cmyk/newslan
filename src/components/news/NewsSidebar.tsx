import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, Clock } from 'lucide-react'
import AdRenderer from './AdRenderer'

interface NewsSidebarProps {
    latestArticles: any[]
    sidebarAds?: any[]
    trendingNews?: any[]
}

export default function NewsSidebar({ latestArticles, sidebarAds = [], trendingNews = [] }: NewsSidebarProps) {
    return (
        <aside className="space-y-10">
            {/* Sidebar Ad Placements */}
            {sidebarAds.length > 0 ? (
                <div className="flex flex-col space-y-12">
                    {sidebarAds.map((ad, index) => (
                        <div key={ad.id || index} className="space-y-2">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="h-px bg-gray-100 flex-1" />
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Advertisement</span>
                                <div className="h-px bg-gray-100 flex-1" />
                            </div>
                            <div className="py-1 flex justify-center">
                                <AdRenderer ad={ad} isSidebar={true} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Advertisement Placeholder (Static) */
                <div className="space-y-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">Advertisement</span>
                    <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:border-primary/30 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-primary font-black text-xl">AD</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400">Pasang Iklan Anda di Sini</p>
                        <p className="text-[10px] text-gray-300 mt-1">Hubungi Redaksi Newslan.id</p>
                    </div>
                </div>
            )}

            {/* Latest News Section */}
            <div className="space-y-6">
                <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-black uppercase tracking-tighter italic">Berita Terbaru</h2>
                </div>

                <div className="space-y-6">
                    {latestArticles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/news/${article.slug}`}
                            className="flex gap-4 group"
                        >
                            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                                <Image
                                    src={article.featured_image || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=200"}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes="96px"
                                />
                            </div>
                            <div className="flex flex-col justify-center space-y-2">
                                <Badge className="w-fit bg-primary/10 text-primary border-none text-[10px] py-0 px-2">
                                    {article.categories?.name || 'News'}
                                </Badge>
                                <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <div className="flex items-center text-[10px] text-gray-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <Link
                    href="/news"
                    className="block w-full text-center py-3 bg-gray-50 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                >
                    Lihat Semua Berita
                </Link>
            </div>

            {/* Secondary Ad */}
            <div className="bg-black rounded-2xl p-8 text-center space-y-4">
                <h3 className="text-white font-black text-lg leading-tight">Langganan Konten Premium?</h3>
                <p className="text-gray-400 text-xs">Dapatkan investigasi mendalam & eksklusif setiap hari.</p>
                <Link
                    href="/subscribe"
                    className="block w-full py-3 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                    Klik Di Sini
                </Link>
            </div>

            {/* Trending News (Sticky) */}
            <div className="sticky top-24 pt-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-[#990000]" />
                            <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">Trending Now</h3>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm">
                            Last 7 Days
                        </span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {trendingNews && trendingNews.length > 0 ? (
                            trendingNews.map((article, idx) => (
                                <Link
                                    key={article.id}
                                    href={`/news/${article.slug}`}
                                    className="block p-4 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`text-2xl font-black italic text-[#990000] leading-none -mt-1 group-hover:scale-110 transition-transform`}>
                                            0{idx + 1}
                                        </span>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-sm font-black text-black leading-tight line-clamp-2 group-hover:text-[#990000] transition-colors">
                                                {article.title}
                                            </h4>
                                            <div className="flex items-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                <span>{article.categories?.name || 'News'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-6 text-center text-gray-400 text-xs">
                                No trending news available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside >
    )
}
