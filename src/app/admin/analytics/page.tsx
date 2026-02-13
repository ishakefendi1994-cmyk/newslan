'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, MousePointer2, Eye, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsPage() {
    const supabase = createClient()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        try {
            setLoading(true)
            // In a real app, you'd query analytics_events table
            // For now we aggregate from main tables
            const { data: articles } = await supabase.from('articles').select('views_count')
            const { data: links } = await supabase.from('affiliate_links').select('click_count')
            const { data: profiles } = await supabase.from('profiles').select('id, role')

            const totalViews = articles?.reduce((acc, a) => acc + (a.views_count || 0), 0) || 0
            const totalClicks = links?.reduce((acc, l) => acc + (l.click_count || 0), 0) || 0
            const totalSubscribers = profiles?.filter(p => p.role === 'subscriber').length || 0
            const totalUsers = profiles?.length || 0

            setStats({
                views: totalViews,
                clicks: totalClicks,
                subscribers: totalSubscribers,
                users: totalUsers,
                ctr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tighter">Analytics</h1>
                <p className="text-gray-500 text-sm">Real-time performance metrics for NEWSLAN.ID</p>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Views', value: stats.views.toLocaleString(), icon: Eye, trend: '+12.5%', isUp: true },
                    { label: 'Affiliate Clicks', value: stats.clicks.toLocaleString(), icon: MousePointer2, trend: '+8.2%', isUp: true },
                    { label: 'Subscribers', value: stats.subscribers, icon: Users, trend: '+3.1%', isUp: true },
                    { label: 'Click-Thru Rate', value: `${stats.ctr}%`, icon: TrendingUp, trend: '-0.4%', isUp: false },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <item.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className={`flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest ${item.isUp ? 'text-green-500' : 'text-red-500'}`}>
                                {item.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span>{item.trend}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">{item.label}</p>
                            <p className="text-3xl font-black mt-1 leading-none">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Traffic Distribution Placeholder */}
                <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-xl tracking-tighter">Traffic Overview</h3>
                        <select className="bg-gray-50 border-none rounded-xl text-xs font-black px-4 py-2 outline-none">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full bg-gray-50/50 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                        <div className="text-center space-y-2">
                            <BarChart3 className="w-10 h-10 text-gray-200 mx-auto" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chart Visualization Placeholder</p>
                        </div>
                    </div>
                </div>

                {/* Top Performing Feed */}
                <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-gray-400">
                    <h3 className="font-black text-xl tracking-tighter text-black">Top Articles</h3>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-black text-gray-300">
                                        {i}
                                    </div>
                                    <p className="text-sm font-bold text-gray-600 group-hover:text-black transition-colors line-clamp-1">
                                        Investigation: Digital Economy 2024
                                    </p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">12.4k</span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-4 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all">
                        View Full Report
                    </button>
                </div>
            </div>
        </div>
    )
}
