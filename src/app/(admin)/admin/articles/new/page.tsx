'use client'

import { useState, useEffect } from 'react'
import { Save, ChevronLeft, Image as ImageIcon, Plus, Settings as SettingsIcon, Loader2, Check, AlertCircle, ShoppingBag, Search, X, Layout } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

const Editor = dynamic(() => import('@/components/admin/ProEditor'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-2xl" />
})

export default function NewArticlePage() {
    const router = useRouter()
    const supabase = createClient()

    // Form State
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [content, setContent] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [featuredImage, setFeaturedImage] = useState('')
    const [isPremium, setIsPremium] = useState(false)
    const [isPublished, setIsPublished] = useState(false)
    const [productPlacement, setProductPlacement] = useState<'middle' | 'after'>('after')
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
    const [focusKeyword, setFocusKeyword] = useState('')

    const [categories, setCategories] = useState<any[]>([])
    const [allProducts, setAllProducts] = useState<any[]>([])
    const [productSearchTerm, setProductSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        fetchCategories()
        fetchProducts()
    }, [])

    async function fetchCategories() {
        const { data } = await supabase.from('categories').select('*').order('name')
        if (data) setCategories(data)
    }

    async function fetchProducts() {
        const { data } = await supabase.from('products').select('id, name').order('name')
        if (data) setAllProducts(data)
    }

    // Auto-generate slug from title
    useEffect(() => {
        if (title) {
            setSlug(title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''))
        }
    }, [title])

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file)
            setFeaturedImage(publicUrl)
            setStatus({ type: 'success', message: 'Gambar berhasil diunggah!' })
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Gagal mengunggah gambar' })
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit() {
        if (!title || !content || !categoryId) {
            setStatus({ type: 'error', message: 'Judul, konten, dan kategori wajib diisi.' })
            return
        }

        try {
            setLoading(true)
            setStatus(null)

            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase.from('articles').insert({
                title,
                slug,
                excerpt,
                content,
                category_id: categoryId,
                featured_image: featuredImage,
                is_premium: isPremium,
                is_published: isPublished,
                product_placement: productPlacement,
                focus_keyword: focusKeyword,
                author_id: user?.id
            }).select().single()

            if (error) throw error
            const newArticleId = data.id

            // Insert article_products
            if (selectedProductIds.length > 0 && newArticleId) {
                const { error: productError } = await supabase.from('article_products').insert(
                    selectedProductIds.map(productId => ({
                        article_id: newArticleId,
                        product_id: productId
                    }))
                )
                if (productError) throw productError
            }

            setStatus({ type: 'success', message: 'Artikel berhasil dipublikasikan!' })
            setTimeout(() => router.push('/admin/articles'), 2000)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Gagal menyimpan artikel' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/articles" className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Artikel Baru</h1>
                        <p className="text-gray-500 text-sm">Buat artikel profesional untuk Newslan.id</p>
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
                        <span>{loading ? 'Publishing...' : 'Posting Artikel'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Editor Main */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-5 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Judul Artikel</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Masukkan judul yang menarik..."
                                className="w-full text-2xl font-black tracking-tight border-none focus:ring-0 placeholder:text-gray-400 p-0"
                            />
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[10px] uppercase font-bold text-gray-300">Slug:</span>
                                <span className="text-[10px] font-mono text-gray-400">{slug || 'otomatis-dibuat'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Pendahuluan (Ringkasan)</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="Tulis ringkasan artikelmu disini..."
                                rows={2}
                                className="w-full text-lg border-none focus:ring-0 placeholder:text-gray-400 p-0 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Konten</label>
                            <Editor value={content} onChange={setContent} placeholder="Tulis Artikelmu disini......" />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* SEO & Configuration */}
                    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <SettingsIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight italic uppercase italic tracking-tighter italic">SEO & Konfigurasi</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 group">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 group-focus-within:text-primary transition-colors">Keyword Utama (SEO)</label>
                                <input
                                    type="text"
                                    value={focusKeyword}
                                    onChange={(e) => setFocusKeyword(e.target.value)}
                                    placeholder="Contoh: Harga iPhone 15 Pro"
                                    className="w-full text-base font-bold border-none underline-offset-8 decoration-slate-200 focus:ring-0 p-0 text-slate-700 bg-transparent placeholder:text-slate-200"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Status Artikel</label>
                                <div className="flex items-center space-x-6">
                                    <button
                                        onClick={() => setIsPublished(false)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${!isPublished ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Konsep
                                    </button>
                                    <button
                                        onClick={() => setIsPublished(true)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${isPublished ? 'bg-[#990000] text-white border-[#990000]' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Publik
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
                        <h3 className="font-bold flex items-center space-x-2">
                            <SettingsIcon className="w-4 h-4 text-primary" />
                            <span>Pengaturan Publikasi</span>
                        </h3>

                        <div className="space-y-6">
                            {/* Visibility */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visibilitas</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsPublished(false)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${!isPublished ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Konsep
                                    </button>
                                    <button
                                        onClick={() => setIsPublished(true)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${isPublished ? 'bg-[#990000] text-white border-[#990000]' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Publik
                                    </button>
                                </div>
                            </div>

                            {/* Premium Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold">Konten Premium</p>
                                    <p className="text-[10px] text-gray-500">Hanya untuk pelanggan</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPremium}
                                        onChange={(e) => setIsPremium(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#990000]"></div>
                                </label>
                            </div>

                            {/* Category Select */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kategori</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none bg-white"
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Featured Image */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gambar Utama</label>
                                {featuredImage ? (
                                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-100 group">
                                        <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <label className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-100">
                                                Ganti Gambar
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="w-full py-12 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-all text-gray-400 cursor-pointer">
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                                        <span className="text-xs font-bold">{uploading ? 'Mengunggah...' : 'Unggah Gambar'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>

                            {/* Related Products Selector */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                    <span>Produk Terkait</span>
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px]">{selectedProductIds.length} terpilih</span>
                                </label>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari produk..."
                                            value={productSearchTerm}
                                            onChange={(e) => setProductSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>

                                    <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-2xl p-2 space-y-1 scrollbar-hide">
                                        {allProducts
                                            .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()))
                                            .map(product => {
                                                const isSelected = selectedProductIds.includes(product.id)
                                                return (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedProductIds(selectedProductIds.filter(pid => pid !== product.id))
                                                            } else {
                                                                setSelectedProductIds([...selectedProductIds, product.id])
                                                            }
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${isSelected ? 'bg-primary text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                                                    >
                                                        <span className="truncate pr-2">{product.name}</span>
                                                        {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                                                    </button>
                                                )
                                            })
                                        }
                                        {allProducts.length === 0 && <p className="text-[10px] text-gray-400 text-center py-4">Belum ada produk.</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                                        <Layout className="w-3 h-3" />
                                        <span>Lokasi Rekomendasi</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setProductPlacement('middle')}
                                            className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${productPlacement === 'middle' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                        >
                                            Tengah Artikel
                                        </button>
                                        <button
                                            onClick={() => setProductPlacement('after')}
                                            className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${productPlacement === 'after' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                        >
                                            Bawah Artikel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
