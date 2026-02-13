'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink, RefreshCw, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

export default function AdminBannersPage() {
    const supabase = createClient()
    const [banners, setBanners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchBanners()
    }, [])

    async function fetchBanners() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('display_order', { ascending: true })

            if (error) throw error
            setBanners(data || [])
        } catch (error) {
            console.error('Error fetching banners:', error)
        } finally {
            setLoading(false)
        }
    }

    async function toggleActive(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('banners')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (!error) {
            setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))
        }
    }

    async function deleteBanner(id: string) {
        if (!confirm('Are you sure you want to delete this banner?')) return

        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id)

        if (!error) {
            setBanners(banners.filter(b => b.id !== id))
        }
    }

    const filteredBanners = banners.filter(b =>
        b.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Banners</h1>
                    <p className="text-gray-500 text-sm">Manage homepage slide banners</p>
                </div>
                <Link
                    href="/admin/banners/new"
                    className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Banner</span>
                </Link>
            </div>

            {/* Stats / Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Banners</p>
                    <p className="text-4xl font-black tracking-tighter">{banners.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Slides</p>
                    <p className="text-4xl font-black tracking-tighter text-green-600">
                        {banners.filter(b => b.is_active).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Banner Context</p>
                    <p className="text-sm font-bold text-gray-500 italic">Recommended Aspect Ratio: 21:9 or 16:9</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search banners..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm font-bold"
                    />
                </div>
                <button
                    onClick={fetchBanners}
                    className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all text-gray-500"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Order</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Preview</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Details</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Banners...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredBanners.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center space-y-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black tracking-tight text-gray-300 italic">No banners found</p>
                                            <p className="text-sm text-gray-400">Start by creating your first slide</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredBanners.map((banner) => (
                                <tr key={banner.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 font-black text-gray-400">#{banner.display_order}</td>
                                    <td className="px-6 py-4">
                                        <div className="relative w-32 aspect-video rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                            <NextImage
                                                src={banner.image_url}
                                                alt={banner.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="font-bold text-gray-900 line-clamp-1">{banner.title || 'Untitled Banner'}</p>
                                            <Link
                                                href={banner.link_url || '#'}
                                                target="_blank"
                                                className="text-xs text-gray-400 hover:text-black transition-colors flex items-center space-x-1"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                <span className="truncate max-w-[150px]">{banner.link_url || 'No Link'}</span>
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleActive(banner.id, banner.is_active)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${banner.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            {banner.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Link
                                                href={`/admin/banners/${banner.id}`}
                                                className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => deleteBanner(banner.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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
    )
}
