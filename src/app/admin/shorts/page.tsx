'use client'

import { useState, useEffect } from 'react'
import { Video, Plus, Search, Trash2, Edit2, Loader2, PlayCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminShortsPage() {
    const supabase = createClient()
    const [shorts, setShorts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchShorts()
    }, [])

    async function fetchShorts() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('shorts')
                .select('*, short_products(product_id)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setShorts(data || [])
        } catch (error) {
            console.error('Error fetching shorts:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Yakin ingin menghapus video ini?')) return

        try {
            const { error } = await supabase
                .from('shorts')
                .delete()
                .eq('id', id)

            if (error) throw error
            setShorts(prev => prev.filter(s => s.id !== id))
        } catch (error: any) {
            alert('Error deleting video: ' + error.message)
        }
    }

    const filteredShorts = shorts.filter(s =>
        (s.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Video Shorts</h1>
                    <p className="text-gray-500 text-sm">Manage your TikTok-style vertical video feed.</p>
                </div>
                <Link
                    href="/admin/shorts/new"
                    className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                    <Plus className="w-5 h-5" />
                    <span>Upload Short</span>
                </Link>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search shorts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-gray-100 focus:ring-0 text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            <span className="text-sm font-bold">Loading shorts...</span>
                        </div>
                    ) : filteredShorts.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400">
                            <Video className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-black uppercase tracking-widest">No videos yet</p>
                        </div>
                    ) : filteredShorts.map((short) => (
                        <div key={short.id} className="group relative aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                            {short.thumbnail_url ? (
                                <img src={short.thumbnail_url} alt={short.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-zinc-900">
                                    <Video className="w-10 h-10 mb-2" />
                                    <span className="text-[10px] uppercase font-black tracking-widest">No Thumbnail</span>
                                </div>
                            )}

                            <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg">
                                        {short.short_products?.length || 0} Products
                                    </span>
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 bg-white text-black rounded-xl hover:bg-gray-100">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(short.id)}
                                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-black text-white leading-tight line-clamp-2">{short.title || 'Untitled Video'}</h3>
                                    <div className="flex items-center justify-between text-white/60 text-[10px] font-bold">
                                        <div className="flex items-center space-x-1">
                                            <Eye className="w-3 h-3" />
                                            <span>{short.views_count} views</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <PlayCircle className="w-3 h-3" />
                                            <span>Live</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-0">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                    <PlayCircle className="w-6 h-6 text-white" />
                                </div>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
