'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    Users,
    FileText,
    MousePointer2,
    Loader2,
    TrendingUp,
    Eye,
    RefreshCcw,
    ArrowUpRight,
    Search,
    Calendar,
    ArrowRight,
    TrendingDown,
    Activity,
    ShoppingBag
} from 'lucide-react'
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

            const [
                { data: articles },
                { data: shorts },
                { count: subscriberCount },
                { data: affiliateLinks },
                { data: products }
            ] = await Promise.all([
                supabase.from('articles').select('views_count, created_at'),
                supabase.from('shorts').select('views_count'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'subscriber'),
                supabase.from('affiliate_links').select('click_count'),
                supabase.from('products').select('*')
            ])

            const totalViews = (articles?.reduce((acc, curr) => acc + (curr.views_count || 0), 0) || 0) +
                (shorts?.reduce((acc, curr) => acc + (curr.views_count || 0), 0) || 0)
            const totalClicks = affiliateLinks?.reduce((acc, curr) => acc + (curr.click_count || 0), 0) || 0

            setStats([
                { name: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12.5%', isPositive: true },
                { name: 'Subscribers', value: (subscriberCount || 0).toLocaleString(), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+5.2%', isPositive: true },
                { name: 'Total Articles', value: (articles?.length || 0).toLocaleString(), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+8.1%', isPositive: true },
                { name: 'Affiliate Clicks', value: totalClicks.toLocaleString(), icon: MousePointer2, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+15.4%', isPositive: true },
            ])

            const [
                { data: recent },
                { data: topAffiliateLinks }
            ] = await Promise.all([
                supabase.from('articles').select('*, categories(name)').order('created_at', { ascending: false }).limit(5),
                supabase.from('affiliate_links').select('product_id, click_count').order('click_count', { ascending: false })
            ])

            setRecentArticles(recent || [])

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
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium animate-pulse text-sm">Menyiapkan Dashboard Anda...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">Pantau performa konten Newslan secara real-time.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center space-x-2 text-slate-500 text-xs font-semibold">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-all flex items-center space-x-2 text-xs font-bold shadow-sm"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bg} w-12 h-12 rounded-xl flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${stat.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                                {stat.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                <span>{stat.trend}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">{stat.name}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Recent Articles */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Artikel Terkini</h3>
                            <p className="text-xs text-slate-500 mt-1">Monitoring performa konten terbaru Anda.</p>
                        </div>
                        <Link href="/admin/articles" className="text-xs font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-all flex items-center">
                            <span>Manage</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                    </div>

                    <div className="p-2 sm:p-4">
                        <div className="space-y-1">
                            {recentArticles.map((article) => (
                                <Link
                                    href={`/admin/articles/${article.id}`}
                                    key={article.id}
                                    className="flex items-center justify-between p-3 sm:p-4 rounded-2xl hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex items-center space-x-4 min-w-0">
                                        <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                            {article.featured_image ? (
                                                <Image src={article.featured_image} alt={article.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{article.title}</h4>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                    {article.categories?.name}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(article.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1.5 text-slate-500 pl-4">
                                        <Eye className="w-4 h-4 opacity-40" />
                                        <span className="text-xs font-bold">{article.views_count || 0}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 flex items-center justify-between border-b border-slate-100 font-sans">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Produk Terpopuler</h3>
                            <p className="text-xs text-slate-500 mt-1">Berdasarkan klik affiliate tertinggi.</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                            <Activity className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>

                    <div className="p-2 sm:p-4 font-sans">
                        <div className="space-y-2">
                            {topProducts.map((product, index) => (
                                <div key={product.id} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-indigo-200 transition-all group">
                                    <div className="flex items-center space-x-4 min-w-0">
                                        <div className="relative w-12 h-12 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-200 p-1.5 shadow-sm">
                                            {product.image_url ? (
                                                <Image src={product.image_url} alt={product.name} fill className="object-contain" unoptimized />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <ShoppingBag className="w-5 h-5 text-slate-200" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{product.name}</h4>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <div className="flex items-center text-amber-500">
                                                    <MousePointer2 className="w-3.5 h-3.5 mr-1" />
                                                    <span className="text-xs font-bold">{product.total_clicks} <span className="text-[10px] text-slate-400 font-medium">Klik</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right pl-4">
                                        <p className="text-sm font-bold text-slate-900">{formatRupiah(product.price_range)}</p>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Active Promo</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
