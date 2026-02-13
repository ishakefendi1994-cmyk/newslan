'use client'

import { useState, useEffect, use } from 'react'
import { Save, ChevronLeft, Image as ImageIcon, Settings as SettingsIcon, Loader2, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

const Editor = dynamic(() => import('@/components/admin/Editor'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-2xl" />
})

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
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

    const [categories, setCategories] = useState<any[]>([])
    const [fetching, setFetching] = useState(true)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        const loadInitialData = async () => {
            await fetchCategories()
            await fetchArticle()
        }
        loadInitialData()
    }, [id])

    async function fetchCategories() {
        const { data } = await supabase.from('categories').select('*').order('name')
        if (data) setCategories(data)
    }

    async function fetchArticle() {
        try {
            setFetching(true)
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (data) {
                setTitle(data.title || '')
                setSlug(data.slug || '')
                setExcerpt(data.excerpt || '')
                setContent(data.content || '')
                setCategoryId(data.category_id || '')
                setFeaturedImage(data.featured_image || '')
                setIsPremium(data.is_premium || false)
                setIsPublished(data.is_published || false)
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error fetching article' })
        } finally {
            setFetching(false)
        }
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file)
            setFeaturedImage(publicUrl)
            setStatus({ type: 'success', message: 'Image uploaded successfully!' })
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error uploading image' })
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit() {
        if (!title || !content || !categoryId) {
            setStatus({ type: 'error', message: 'Title, content, and category are required.' })
            return
        }

        try {
            setLoading(true)
            setStatus(null)

            const { error } = await supabase
                .from('articles')
                .update({
                    title,
                    slug,
                    excerpt,
                    content,
                    category_id: categoryId,
                    featured_image: featuredImage,
                    is_premium: isPremium,
                    is_published: isPublished,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error

            setStatus({ type: 'success', message: 'Article updated successfully!' })
            setTimeout(() => router.push('/admin/articles'), 2000)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error saving article' })
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Memuat Data Artikel...</p>
            </div>
        )
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
                        <h1 className="text-3xl font-black tracking-tighter">Edit Article</h1>
                        <p className="text-gray-500 text-sm">Update your existing post on NEWSLAN.ID</p>
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
                        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Editor Main */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Article Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a catchy title..."
                                className="w-full text-2xl font-black tracking-tight border-none focus:ring-0 placeholder:text-gray-200 p-0"
                            />
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[10px] uppercase font-bold text-gray-300">Slug:</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="text-[10px] font-mono text-gray-400 bg-transparent border-none p-0 focus:ring-0 w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Introduction (Excerpt)</label>
                            <textarea
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                placeholder="Short summary for the preview card..."
                                rows={2}
                                className="w-full text-lg border-none focus:ring-0 placeholder:text-gray-200 p-0 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Content</label>
                            <Editor value={content} onChange={setContent} placeholder="Write your investigative report here..." />
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 sticky top-24">
                        <h3 className="font-bold flex items-center space-x-2">
                            <SettingsIcon className="w-4 h-4 text-primary" />
                            <span>Publishing Settings</span>
                        </h3>

                        <div className="space-y-6">
                            {/* Visibility */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visibility</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsPublished(false)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${!isPublished ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Draft
                                    </button>
                                    <button
                                        onClick={() => setIsPublished(true)}
                                        className={`py-3 rounded-2xl text-xs font-bold border transition-all ${isPublished ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-100'}`}
                                    >
                                        Public
                                    </button>
                                </div>
                            </div>

                            {/* Premium Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold">Premium Content</p>
                                    <p className="text-[10px] text-gray-500">Only for subscribers</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPremium}
                                        onChange={(e) => setIsPremium(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Category Select */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none bg-white"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Featured Image */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Featured Image</label>
                                {featuredImage ? (
                                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-100 group">
                                        <img src={featuredImage} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <label className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-100">
                                                Change Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="w-full py-12 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-all text-gray-400 cursor-pointer">
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                                        <span className="text-xs font-bold">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
