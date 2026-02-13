'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, RefreshCw, Edit2, Trash2, Info, Layout, Code, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

const placements = {
    header_bottom: 'Below Menu',
    article_before: 'Before Article',
    article_middle: 'Middle of Article',
    article_after: 'After Article',
    sidebar: 'Sidebar (News Detail)',
    section_sidebar: 'Category Section Sidebar',
    feed_between: 'Between Feed Items',
    skin_left: 'Left Skin (Desktop)',
    skin_right: 'Right Skin (Desktop)'
}

export default function AdminAdsPage() {
    const supabase = createClient()
    const [ads, setAds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchAds()
    }, [])

    async function fetchAds() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('advertisements')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAds(data || [])
        } catch (error: any) {
            console.error('Error fetching ads:', error.message || error)
        } finally {
            setLoading(false)
        }
    }

    async function toggleActive(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('advertisements')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (!error) {
            setAds(ads.map(ad => ad.id === id ? { ...ad, is_active: !currentStatus } : ad))
        }
    }

    async function deleteAd(id: string) {
        if (!confirm('Are you sure you want to delete this advertisement?')) return

        const { error } = await supabase
            .from('advertisements')
            .delete()
            .eq('id', id)

        if (!error) {
            setAds(ads.filter(ad => ad.id !== id))
        }
    }

    const filteredAds = ads.filter(ad =>
        ad.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic">Advertisements</h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Manage ad placements & types</p>
                </div>
                <Link
                    href="/admin/ads/new"
                    className="bg-primary text-white px-6 py-3 rounded-none font-black flex items-center justify-center space-x-2 hover:bg-red-700 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Ad</span>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Ads</p>
                    <p className="text-4xl font-black tracking-tighter italic">{ads.length}</p>
                </div>
                <div className="bg-white p-6 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Ads</p>
                    <p className="text-4xl font-black tracking-tighter text-red-600 italic">
                        {ads.filter(ad => ad.is_active).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-2 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ad Types</p>
                        <div className="flex space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                                <ImageIcon className="w-3 h-3 text-blue-500" />
                                <span className="text-xs font-bold">{ads.filter(a => a.type === 'image').length}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Code className="w-3 h-3 text-purple-500" />
                                <span className="text-xs font-bold">{ads.filter(a => a.type === 'html').length}</span>
                            </div>
                        </div>
                    </div>
                    <Layout className="w-8 h-8 text-gray-100" />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-none border-4 border-black">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="SEARCH ADS BY TITLE..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-none bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-black uppercase tracking-widest"
                    />
                </div>
                <button
                    onClick={fetchAds}
                    className="p-3 bg-gray-50 hover:bg-black hover:text-white transition-all text-gray-500"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Ads List */}
            <div className="bg-white rounded-none border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black text-white">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Placement</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Preview/Details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Scanning DB...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAds.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-none border-2 border-dashed border-gray-200 flex items-center justify-center">
                                                <Info className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black tracking-tight text-gray-300 italic uppercase">No ads configured</p>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Start monetizing Newslan now</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAds.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className={`w-10 h-10 rounded-none border flex items-center justify-center ${ad.type === 'image' ? 'bg-blue-50 border-blue-200 text-blue-500' :
                                                ad.type === 'html' ? 'bg-purple-50 border-purple-200 text-purple-500' :
                                                    'bg-red-50 border-red-200 text-red-500'
                                                }`}>
                                                {ad.type === 'image' ? <ImageIcon className="w-5 h-5" /> :
                                                    ad.type === 'html' ? <Code className="w-5 h-5" /> :
                                                        <Layout className="w-5 h-5" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 border border-gray-200">
                                                {placements[ad.placement as keyof typeof placements] || ad.placement}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-4">
                                                {ad.type === 'image' && ad.image_url ? (
                                                    <div className="relative w-20 aspect-video shrink-0 border-2 border-black">
                                                        <NextImage src={ad.image_url} alt={ad.title} fill className="object-cover" />
                                                    </div>
                                                ) : ad.type === 'product_list' ? (
                                                    <div className="w-20 aspect-video shrink-0 bg-red-600 flex items-center justify-center border-2 border-black">
                                                        <Layout className="w-6 h-6 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-20 aspect-video shrink-0 bg-black flex items-center justify-center border-2 border-black">
                                                        <span className="text-[8px] font-black text-white italic">HTML CODE</span>
                                                    </div>
                                                )}
                                                <div className="space-y-0.5">
                                                    <p className="font-black text-sm uppercase italic leading-none">{ad.title}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold truncate max-w-[200px]">
                                                        {ad.type === 'image' ? ad.link_url : ad.type === 'product_list' ? 'Dynamic Product Catalog' : 'Dynamic Script/HTML'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleActive(ad.id, ad.is_active)}
                                                className={`px-4 py-1.5 rounded-none text-[10px] font-black uppercase tracking-widest border-2 transition-all ${ad.is_active ? 'bg-green-500 text-white border-green-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                                            >
                                                {ad.is_active ? 'Active' : 'Paused'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-3">
                                                <Link
                                                    href={`/admin/ads/${ad.id}`}
                                                    className="p-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => deleteAd(ad.id)}
                                                    className="p-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
