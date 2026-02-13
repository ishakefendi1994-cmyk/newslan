'use client'

import { useState, useEffect } from 'react'
import { Save, ChevronLeft, Image as ImageIcon, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

export default function EditBannerPage() {
    const router = useRouter()
    const { id } = useParams()
    const supabase = createClient()

    // Form State
    const [title, setTitle] = useState('')
    const [linkUrl, setLinkUrl] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [displayOrder, setDisplayOrder] = useState('0')
    const [isActive, setIsActive] = useState(true)

    const [fetching, setFetching] = useState(true)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        if (id) fetchBanner()
    }, [id])

    async function fetchBanner() {
        try {
            setFetching(true)
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (data) {
                setTitle(data.title || '')
                setLinkUrl(data.link_url || '')
                setImageUrl(data.image_url || '')
                setDisplayOrder(data.display_order?.toString() || '0')
                setIsActive(data.is_active)
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error fetching banner' })
        } finally {
            setFetching(false)
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file, 'banners')
            setImageUrl(publicUrl)
            setStatus({ type: 'success', message: 'Image uploaded successfully!' })
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error uploading image' })
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit() {
        if (!imageUrl) {
            setStatus({ type: 'error', message: 'Banner image is required.' })
            return
        }

        try {
            setLoading(true)
            setStatus(null)

            const { error } = await supabase.from('banners').update({
                title,
                link_url: linkUrl,
                image_url: imageUrl,
                display_order: parseInt(displayOrder) || 0,
                is_active: isActive,
                updated_at: new Date().toISOString()
            }).eq('id', id)

            if (error) throw error

            setStatus({ type: 'success', message: 'Banner updated successfully!' })
            setTimeout(() => router.push('/admin/banners'), 1500)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error saving banner' })
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this banner?')) return

        try {
            setLoading(true)
            const { error } = await supabase.from('banners').delete().eq('id', id)
            if (error) throw error
            router.push('/admin/banners')
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error deleting banner' })
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading Banner Data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/banners" className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Edit Banner</h1>
                        <p className="text-gray-500 text-sm">Update slide content and appearance</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {status && (
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>{status.message}</span>
                        </div>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || uploading}
                        className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{loading ? 'Saving...' : 'Update Banner'}</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading || uploading}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Banner Image</label>
                                {imageUrl ? (
                                    <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden border border-gray-100 group">
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <label className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-100">
                                                Change Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="w-full py-20 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-all text-gray-400 cursor-pointer">
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                                        <div className="text-center">
                                            <span className="text-xs font-bold block">{uploading ? 'Uploading...' : 'Upload Banner Image'}</span>
                                            <span className="text-[10px] text-gray-300">Recommended size: 1200x500px</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Banner Title (Optional)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter banner title..."
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 outline-none text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Link URL (Optional)</label>
                                <input
                                    type="text"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com/news/..."
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 outline-none text-sm font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Settings */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h3 className="font-bold flex items-center space-x-2">
                            <span>Configuration</span>
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Display Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsActive(false)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${!isActive ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Hidden
                                    </button>
                                    <button
                                        onClick={() => setIsActive(true)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${isActive ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Active
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sort Order</label>
                                <input
                                    type="number"
                                    value={displayOrder}
                                    onChange={(e) => setDisplayOrder(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black/5 outline-none text-sm font-bold"
                                />
                                <p className="text-[10px] text-gray-400 italic">Lower numbers appear first.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
