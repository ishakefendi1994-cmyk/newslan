
'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Save, Send, Type, Image as ImageIcon, CheckCircle, RefreshCcw, Layout } from 'lucide-react'

const NEWS_STYLES = ['Formal', 'Santai', 'Investigatif', 'Provokatif', 'Inspiratif']
const NEWS_MODELS = ['Breaking News', 'Feature Story', 'Opinion', 'Interview', 'Editorial']

export default function AIWriterPage() {
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showDebug, setShowDebug] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        theme: '',
        categoryId: '',
        style: 'Formal',
        model: 'Breaking News',
        language: 'id',
        generateImage: true
    })

    // Result State
    const [generatedArticle, setGeneratedArticle] = useState<{
        title: string
        content: string
        excerpt: string
        imageUrl: string | null
    } | null>(null)

    const [savedStatus, setSavedStatus] = useState<string | null>(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories')
            const data = await res.json()
            if (Array.isArray(data)) {
                setCategories(data)
                if (data.length > 0) setFormData(prev => ({ ...prev, categoryId: data[0].id }))
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }

    const handleGenerate = async () => {
        const selectedCategory = categories.find(c => c.id === formData.categoryId)

        if (!formData.theme) {
            alert('Silakan masukkan tema atau topik artikel!')
            return
        }

        if (!selectedCategory) {
            alert('Silakan pilih kategori!')
            return
        }

        setLoading(true)
        setGeneratedArticle(null)
        setSavedStatus(null)

        try {
            const res = await fetch('/api/ai/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    theme: formData.theme,
                    category: selectedCategory.name,
                    style: formData.style,
                    model: formData.model,
                    language: formData.language,
                    generateImage: formData.generateImage
                })
            })

            const data = await res.json()
            if (data.success) {
                setGeneratedArticle(data.data)
            } else {
                alert('Gagal: ' + data.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!generatedArticle) return

        setIsSaving(true)
        try {
            const res = await fetch('/api/rss/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: generatedArticle.title,
                    content: generatedArticle.content,
                    excerpt: generatedArticle.excerpt,
                    image: generatedArticle.imageUrl,
                    categoryId: formData.categoryId,
                    sourceName: 'AI Creative Writer',
                    isPublished: true,
                    showSourceAttribution: false
                })
            })

            const data = await res.json()
            if (data.success) {
                setSavedStatus('Artikel berhasil dipublish!')
            } else {
                alert('Gagal menyimpan: ' + data.error)
            }
        } catch (err: any) {
            alert('Error saat menyimpan: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black flex items-center gap-3">
                    <Sparkles className="w-10 h-10 text-purple-600" />
                    AI Creative Writer
                </h1>
                <p className="text-gray-600 mt-2 text-lg">Buat berita berkualitas tinggi dari nol hanya dengan satu tema.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Sidebar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Layout className="w-5 h-5 text-[#990000]" />
                            Konfigurasi Artikel
                        </h2>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Tema atau Topik</label>
                            <textarea
                                value={formData.theme}
                                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                placeholder="Contoh: Dampak kenaikan harga emas terhadap investasi anak muda di Indonesia..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] min-h-[120px] transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Kategori</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Gaya Penulisan</label>
                                <select
                                    value={formData.style}
                                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                                >
                                    {NEWS_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Model Berita</label>
                                <select
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                                >
                                    {NEWS_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block text-purple-900 border-l-4 border-purple-600 pl-3">Target Bahasa</label>
                            <select
                                value={formData.language}
                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                className="w-full px-4 py-3 border border-purple-200 bg-purple-50 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-600 font-bold"
                            >
                                <option value="id">🇮🇩 Bahasa Indonesia</option>
                                <option value="en">🇺🇸 Bahasa Inggris (English)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <input
                                type="checkbox"
                                id="genImg"
                                checked={formData.generateImage}
                                onChange={(e) => setFormData({ ...formData, generateImage: e.target.checked })}
                                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="genImg" className="text-sm text-purple-900 font-bold cursor-pointer">
                                Buatkan Thumbnail AI (Replicate)
                            </label>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-4 bg-[#990000] text-white font-black rounded-xl hover:bg-[#990000]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/10"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Tunggu sebentar...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    BUAT ARTIKEL SEKARANG
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content Area (8 cols) */}
                <div className="lg:col-span-8">
                    {!generatedArticle && !loading && (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-20 text-center">
                            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                                <Type className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-400">Hasil akan muncul di sini</h3>
                            <p className="text-gray-400 mt-2">Gunakan sidebar untuk mengatur tema artikel Anda.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center animate-pulse">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#990000] mb-4" />
                            <h3 className="text-2xl font-black text-gray-800">AI Sedang Berpikir...</h3>
                            <p className="text-gray-500 mt-2 italic text-lg text-balance">
                                "Menyusun kalimat, melakukan riset internal, dan melukis ilustrasi..."
                            </p>
                            <div className="mt-8 space-y-4">
                                <div className="h-8 bg-gray-100 rounded-full w-3/4 mx-auto" />
                                <div className="h-4 bg-gray-100 rounded-full w-full" />
                                <div className="h-4 bg-gray-100 rounded-full w-5/6 mx-auto" />
                            </div>
                        </div>
                    )}

                    {generatedArticle && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            {/* Toolbar */}
                            <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Preview Mode</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowDebug(!showDebug)}
                                        className={`px-3 py-1.5 text-sm font-bold flex items-center gap-1.5 rounded-lg transition-all ${showDebug ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <Layout className="w-4 h-4" /> {showDebug ? 'Hasil Jadi' : 'Lihat HTML'}
                                    </button>
                                    <button
                                        onClick={() => setGeneratedArticle(null)}
                                        className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
                                    >
                                        <RefreshCcw className="w-4 h-4" /> Reset
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || savedStatus !== null}
                                        className={`px-6 py-1.5 h-10 rounded-lg flex items-center gap-2 font-black transition-all ${savedStatus
                                            ? 'bg-green-100 text-green-700 cursor-default'
                                            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20'
                                            }`}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : savedStatus ? (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                PUBLISHED
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                PUBLISH KE NEWSIAN
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {generatedArticle.imageUrl && (
                                    <div className="relative group">
                                        <img
                                            src={generatedArticle.imageUrl}
                                            alt="AI Generated Thumbnail"
                                            className="w-full aspect-video object-cover rounded-xl shadow-xl border border-gray-100"
                                        />
                                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-white" />
                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">AI Generated Art</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                                        {generatedArticle.title}
                                    </h2>

                                    <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-gray-300">
                                        <p className="text-gray-600 font-medium italic">
                                            {generatedArticle.excerpt}
                                        </p>
                                    </div>

                                    <div
                                        className="prose prose-lg max-w-none prose-p:text-gray-700 prose-p:text-lg prose-p:leading-relaxed prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b-4 prose-h2:border-[#990000]/10 prose-h2:pb-2 prose-strong:text-black prose-strong:font-bold"
                                        dangerouslySetInnerHTML={{ __html: generatedArticle.content }}
                                    />
                                </div>
                            </div>

                            {showDebug && (
                                <div className="p-8 bg-slate-900 text-green-400 font-mono text-xs overflow-auto max-h-[400px]">
                                    <h4 className="text-white font-bold mb-4 uppercase border-b border-white/20 pb-2">Raw HTML Debugger</h4>
                                    <pre className="whitespace-pre-wrap">{generatedArticle.content}</pre>
                                </div>
                            )}

                            <div className="flex-1"></div>


                            {savedStatus && (
                                <div className="m-8 p-6 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-green-900">{savedStatus}</h4>
                                        <p className="text-green-700">Artikel Anda sudah live dan siap dibaca oleh jutaan orang!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
