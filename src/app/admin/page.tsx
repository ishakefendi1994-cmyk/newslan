'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Users, FileText, MousePointer2, Loader2, TrendingUp, TrendingDown, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminDashboard() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any[]>([])
    const [recentArticles, setRecentArticles] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            setLoading(true)

            // 1. Fetch Basic Stats
            const { data: articles } = await supabase.from('articles').select('views_count, created_at')
            const { data: shorts } = await supabase.from('shorts').select('views_count')
            const { count: subscriberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'subscriber')
            const { data: affiliateLinks } = await supabase.from('affiliate_links').select('click_count')
            const { data: products } = await supabase.from('products').select('*')

            const totalViews = (articles?.reduce((acc, curr) => acc + (curr.views_count || 0), 0) || 0) +
                (shorts?.reduce((acc, curr) => acc + (curr.views_count || 0), 0) || 0)
            const totalClicks = affiliateLinks?.reduce((acc, curr) => acc + (curr.click_count || 0), 0) || 0

            setStats([
                { name: 'Total Views', value: totalViews.toLocaleString(), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
                { name: 'Subscribers', value: (subscriberCount || 0).toLocaleString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+5%' },
                { name: 'Total Articles', value: (articles?.length || 0).toLocaleString(), icon: FileText, color: 'text-green-600', bg: 'bg-green-50', trend: '+8%' },
                { name: 'Affiliate Clicks', value: totalClicks.toLocaleString(), icon: MousePointer2, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+15%' },
            ])

            // 2. Fetch Recent Articles
            const { data: recent } = await supabase
                .from('articles')
                .select('*, categories(name)')
                .order('created_at', { ascending: false })
                .limit(5)
            setRecentArticles(recent || [])

            // 3. Fetch Top Performing Products (based on affiliate click counts)
            const { data: topAffiliateLinks } = await supabase
                .from('affiliate_links')
                .select('product_id, click_count')
                .order('click_count', { ascending: false })

            // Group and aggregate clicks by product_id
            const productClickMap: Record<string, number> = {}
            topAffiliateLinks?.forEach(link => {
                productClickMap[link.product_id] = (productClickMap[link.product_id] || 0) + link.click_count
            })

            const sortedTopProducts = products
                ?.map(p => ({ ...p, total_clicks: productClickMap[p.id] || 0 }))
                .sort((a, b) => b.total_clicks - a.total_clicks)
                .slice(0, 5)

            setTopProducts(sortedTopProducts || [])

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Menyatukan Data Newslan...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Dashboard Overview</h1>
                    <p className="text-gray-500">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <button
                    onClick={fetchDashboardData}
                    className="bg-gray-50 hover:bg-gray-100 p-3 rounded-2xl border border-gray-100 transition-all flex items-center space-x-2 text-xs font-bold"
                >
                    <Loader2 className="w-4 h-4" />
                    <span>Refresh Stats</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm group hover:shadow-xl hover:shadow-gray-200 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bg} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-[10px] font-black italic">
                                <TrendingUp className="w-3 h-3" />
                                <span>{stat.trend}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-3xl font-black tracking-tighter">{stat.value}</span>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.name}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black italic uppercase italic tracking-tighter">Berita Terbaru</h3>
                            <p className="text-xs text-gray-400 font-medium">Monitoring performa artikel terkini.</p>
                        </div>
                        <Link href="/admin/articles" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Lihat Semua</Link>
                    </div>

                    <div className="space-y-3">
                        {recentArticles.map((article) => (
                            <Link
                                href={`/admin/articles/${article.id}`}
                                key={article.id}
                                className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group"
                            >
                                <div className="relative w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                                    {article.featured_image ? (
                                        <Image src={article.featured_image} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-gray-200" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{article.title}</h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded italic uppercase tracking-widest">
                                            {article.categories?.name}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                            {new Date(article.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-500 px-3">
                                    <Eye className="w-3 h-3" />
                                    <span className="text-[10px] font-black">{article.views_count || 0}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black italic uppercase italic tracking-tighter">Produk Andalan</h3>
                            <p className="text-xs text-gray-400 font-medium">Berdasarkan klik affiliate terbanyak.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {topProducts.map((product) => (
                            <div key={product.id} className="flex items-center space-x-4 p-3 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                <div className="relative w-12 h-12 rounded-xl bg-white overflow-hidden shrink-0 border border-gray-100 p-1">
                                    {product.image_url ? (
                                        <Image src={product.image_url} alt={product.name} fill className="object-contain" unoptimized />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <MousePointer2 className="w-5 h-5 text-gray-100" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold truncate">{product.name}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                        {product.total_clicks} Kunjungan Link
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-black">{formatRupiah(product.price_range)}</span>
                                    <div className="flex items-center justify-end space-x-1 text-green-600">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase italic tracking-tighter">High ROI</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
