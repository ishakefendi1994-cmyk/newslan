'use client'

import { useState, useEffect } from 'react'
import {
    Youtube,
    Sparkles,
    Loader2,
    Save,
    Send,
    Type,
    Image as ImageIcon,
    CheckCircle,
    RefreshCcw,
    Layout,
    Search,
    AlertCircle,
    ChevronRight,
    MessageSquareText,
    AudioLines
} from 'lucide-react'

const NEWS_STYLES = ['Professional', 'Casual', 'Investigative', 'Educational']
const NEWS_MODELS = ['Straight News', 'Feature Story', 'Opinion Analysis']

export default function YouTubeToNewsPage() {
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
    const [loading, setLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [step, setStep] = useState(1) // 1: URL, 2: Transcript, 3: Result

    // YouTube State
    const [ytUrl, setYtUrl] = useState('')
    const [videoData, setVideoData] = useState<any>(null)
    const [transcript, setTranscript] = useState('')
    const [isExtracting, setIsExtracting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        categoryId: '',
        style: 'Professional',
        model: 'Straight News',
        language: 'id'
    })

    // Result State
    const [generatedArticle, setGeneratedArticle] = useState<{
        title: string
        content: string
        excerpt: string
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

    const handleExtract = async () => {
        if (!ytUrl) return

        setIsExtracting(true)
        setVideoData(null)
        setTranscript('')

        try {
            const res = await fetch('/api/youtube/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: ytUrl })
            })

            const json = await res.json()
            if (json.success) {
                setVideoData(json.data)
                setTranscript(json.data.transcript || '')
                setStep(2)
            } else {
                alert('Gagal mengambil data video: ' + json.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setIsExtracting(false)
        }
    }

    const handleGenerate = async () => {
        if (!transcript) {
            alert('Transkrip kosong. Silakan masukkan transkrip secara manual jika ekstraksi gagal.')
            return
        }

        setLoading(true)
        setGeneratedArticle(null)
        setSavedStatus(null)

        try {
            const res = await fetch('/api/youtube/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript,
                    videoTitle: videoData?.title || 'YouTube Video',
                    style: formData.style,
                    model: formData.model,
                    language: formData.language
                })
            })

            const data = await res.json()
            if (data.success) {
                setGeneratedArticle(data.data)
                setStep(3)
            } else {
                alert('Gagal membuat berita: ' + data.error)
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
                    image: videoData?.thumbnail,
                    categoryId: formData.categoryId,
                    sourceName: 'YouTube News Engine',
                    isPublished: true,
                    showSourceAttribution: true
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

    const reset = () => {
        setStep(1)
        setYtUrl('')
        setVideoData(null)
        setTranscript('')
        setGeneratedArticle(null)
        setSavedStatus(null)
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black flex items-center gap-3">
                        <Youtube className="w-10 h-10 text-red-600" />
                        YouTube to News
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">Ubah video YouTube menjadi berita berkualitas dalam hitungan detik.</p>
                </div>
                {step > 1 && (
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all w-fit"
                    >
                        <RefreshCcw className="w-4 h-4" /> Mulai Ulang
                    </button>
                )}
            </div>

            {/* Stepper UI */}
            <div className="flex items-center gap-4 max-w-2xl">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${step === s ? 'bg-red-600 text-white shadow-lg shadow-red-200' :
                            step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                            {step > s ? '✓' : s}
                        </div>
                        {s < 3 && <div className={`h-1 flex-1 rounded-full ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Step 1: URL Input */}
                {step === 1 && (
                    <div className="lg:col-span-8 lg:col-start-3 space-y-6">
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-black">Masukkan Link Video</h2>
                                <p className="text-gray-500">Sistem akan mengambil transkrip otomatis jika tersedia.</p>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-red-600 transition-colors" />
                                <input
                                    type="text"
                                    value={ytUrl}
                                    onChange={(e) => setYtUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-red-600 focus:bg-white rounded-2xl text-lg font-bold transition-all outline-none"
                                />
                            </div>

                            <button
                                onClick={handleExtract}
                                disabled={!ytUrl || isExtracting}
                                className="w-full py-5 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-xl shadow-xl shadow-red-200"
                            >
                                {isExtracting ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        MENDOWNLOAD & TRANSKRIP (WHISPER AI)...
                                    </>
                                ) : (
                                    <>
                                        LANJUTKAN <ChevronRight className="w-6 h-6" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Transcript & Analysis Configuration */}
                {step === 2 && videoData && (
                    <>
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <h2 className="font-black flex items-center gap-2">
                                        <MessageSquareText className="w-5 h-5 text-red-600" />
                                        Review Transkrip
                                    </h2>
                                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider">
                                        Manual Edit Enabled
                                    </span>
                                </div>
                                <div className="p-6 space-y-4">
                                    {!transcript && (
                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3 text-orange-800">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <div>
                                                <p className="font-bold text-sm">Gagal mengambil transkrip otomatis.</p>
                                                <p className="text-xs">Ulangi atau tempel (paste) transkrip manual dari YouTube di kotak bawah.</p>
                                            </div>
                                        </div>
                                    )}
                                    <textarea
                                        value={transcript}
                                        onChange={(e) => setTranscript(e.target.value)}
                                        placeholder="Tempel transkrip di sini jika ekstraksi gagal..."
                                        className="w-full min-h-[400px] p-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-600/10 text-gray-700 font-medium leading-relaxed resize-none"
                                    />
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-wider bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                                            <AudioLines className="w-3 h-3" />
                                            Processed with Whisper AI
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {transcript.length} Characters
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Video Preview</label>
                                    <div className="rounded-xl overflow-hidden aspect-video border border-gray-100">
                                        <img src={videoData.thumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-bold leading-tight">{videoData.title}</h3>
                                </div>

                                <hr className="border-gray-50" />

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Setting Berita</label>

                                    <div className="space-y-2">
                                        <span className="text-sm font-bold block text-gray-700">Pilih Kategori</span>
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold"
                                        >
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <span className="text-sm font-bold block text-gray-700">Gaya Penulisan</span>
                                            <select
                                                value={formData.style}
                                                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold"
                                            >
                                                {NEWS_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-sm font-bold block text-gray-700">Struktur Berita</span>
                                            <select
                                                value={formData.model}
                                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold"
                                            >
                                                {NEWS_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !transcript}
                                    className="w-full py-5 bg-black text-white font-black rounded-2xl hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            AI SEDANG MENULIS...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" /> BUAT BERITA SEKARANG
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Step 3: Result Analysis */}
                {step === 3 && generatedArticle && (
                    <div className="lg:col-span-8 lg:col-start-3 space-y-6">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            {/* Toolbar */}
                            <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Final Article Preview</span>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || savedStatus !== null}
                                    className={`px-6 py-2 h-12 rounded-xl flex items-center gap-2 font-black transition-all ${savedStatus
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20'
                                        }`}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : savedStatus ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            LIVE ON SITE
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            PUBLISH ARTIKEL
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-gray-900 leading-tight">
                                        {generatedArticle.title}
                                    </h2>

                                    <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-red-600">
                                        <p className="text-gray-600 font-medium italic">
                                            {generatedArticle.excerpt}
                                        </p>
                                    </div>

                                    <div
                                        className="prose prose-lg max-w-none prose-p:text-gray-700 prose-p:text-lg prose-p:leading-relaxed prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-3xl prose-h2:mt-12 prose-strong:text-black"
                                        dangerouslySetInnerHTML={{ __html: generatedArticle.content }}
                                    />
                                </div>
                            </div>

                            {savedStatus && (
                                <div className="m-8 p-6 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-green-900">{savedStatus}</h4>
                                        <p className="text-green-700">Artikel telah berhasil diterbitkan ke halaman utama.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
