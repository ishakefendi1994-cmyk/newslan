'use client'

import { useState, useEffect } from 'react'
import { Save, ChevronLeft, Video, Loader2, Check, AlertCircle, ShoppingBag, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

export default function NewShortPage() {
    const router = useRouter()
    const supabase = createClient()

    const [title, setTitle] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [selectedProducts, setSelectedProducts] = useState<any[]>([])

    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState<{ video: boolean, thumb: boolean }>({ video: false, thumb: false })
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        const { data } = await supabase.from('products').select('id, name').order('name')
        if (data) setProducts(data)
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'thumb') {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(prev => ({ ...prev, [type]: true }))
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file)

            if (type === 'video') setVideoUrl(publicUrl)
            else setThumbnailUrl(publicUrl)
        } catch (error: any) {
            setStatus({ type: 'error', message: `Error uploading ${type}: ${error.message}` })
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }))
        }
    }

    const getYouTubeID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const toggleProduct = (productId: string) => {
        if (selectedProducts.includes(productId)) {
            setSelectedProducts(selectedProducts.filter(id => id !== productId))
        } else {
            setSelectedProducts([...selectedProducts, productId])
        }
    }

    async function handleSubmit() {
        if (!videoUrl) {
            setStatus({ type: 'error', message: 'YouTube URL is required.' })
            return
        }

        const ytId = getYouTubeID(videoUrl)
        if (!ytId) {
            setStatus({ type: 'error', message: 'Invalid YouTube URL. Please provide a valid YouTube Shorts link.' })
            return
        }

        try {
            setLoading(true)
            setStatus(null)

            // 1. Create Short
            const { data: short, error: sError } = await supabase
                .from('shorts')
                .insert({
                    title,
                    video_url: videoUrl,
                    thumbnail_url: thumbnailUrl || `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
                })
                .select()
                .single()

            if (sError) throw sError

            // 2. Link Products
            if (selectedProducts.length > 0) {
                const { error: lError } = await supabase
                    .from('short_products')
                    .insert(selectedProducts.map(pid => ({ short_id: short.id, product_id: pid })))

                if (lError) throw lError
            }

            setStatus({ type: 'success', message: 'Video short published successfully!' })
            setTimeout(() => router.push('/admin/shorts'), 2000)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error saving video' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/shorts" className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Upload Short</h1>
                        <p className="text-gray-500 text-sm">Add a vertical video story.</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading || uploading.video || uploading.thumb}
                    className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{loading ? 'Processing...' : 'Publish Video'}</span>
                </button>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{status.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Video Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Describe your video..."
                                className="w-full text-xl font-black border-none focus:ring-0 placeholder:text-gray-200 p-0"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">YouTube Shorts URL</label>
                            <input
                                type="text"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/shorts/..."
                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white outline-none transition-all font-bold text-sm"
                            />
                            {videoUrl && (
                                <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
                                    Link YouTube terdeteksi. Sistem akan memuat video dari YouTube.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Thumbnail Preview</label>
                        {thumbnailUrl ? (
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-100 group">
                                <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <label className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-100">
                                        Change Thumbnail
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumb')} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="w-full py-12 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-all text-gray-400 cursor-pointer">
                                {uploading.thumb ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                                <span className="text-xs font-bold">{uploading.thumb ? 'Upload Thumbnail' : 'Auto-gen or Select'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'thumb')} disabled={uploading.thumb} />
                            </label>
                        )}
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Tag Products</label>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                            {products.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => toggleProduct(p.id)}
                                    className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between ${selectedProducts.includes(p.id) ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-100'}`}
                                >
                                    <span>{p.name}</span>
                                    {selectedProducts.includes(p.id) && <Check className="w-3 h-3 text-primary" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
