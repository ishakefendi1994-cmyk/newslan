'use client'

import { useState, useEffect } from 'react'
import {
    Plus,
    Trash2,
    RefreshCw,
    ExternalLink,
    Check,
    Play,
    Pause,
    AlertCircle,
    Globe,
    ChevronRight,
    Copy,
    Sparkles,
    Search,
    Loader2,
    Pencil,
    X
} from 'lucide-react'
import { RSS_FEEDS } from '@/lib/rss/feeds'

interface RSSJob {
    id: string
    name: string
    task_key: string
    rss_url: string
    category_id: string | null
    categories?: { name: string }
    show_source_attribution: boolean
    use_ai_image: boolean
    is_published: boolean
    max_articles_per_run: number
    is_active: boolean
    last_run_at: string | null
    last_run_status: string | null
    last_run_articles: number
    total_runs: number
    total_articles_published: number
    target_language: string
    writing_style: string
    article_model: string
    job_type: string
    search_keyword: string | null
    trend_region: string
    trend_niche: string
    thumbnail_priority: string
    created_at: string
}

export default function RSSJobsPage() {
    const [jobs, setJobs] = useState<RSSJob[]>([])
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        rssUrl: '',
        manualRssUrl: '',
        categoryId: '',
        isPublished: true,
        showSourceAttribution: true,
        useAIImage: false,
        maxArticlesPerRun: 3,
        targetLanguage: 'id',
        writingStyle: 'Professional',
        articleModel: 'Straight News',
        jobType: 'standard',
        searchKeyword: '',
        trendRegion: 'local',
        trendNiche: 'any',
        thumbnailPriority: 'ai_priority'
    })
    const [creating, setCreating] = useState(false)
    const [editingJobId, setEditingJobId] = useState<string | null>(null)
    const [newJobUrl, setNewJobUrl] = useState<string | null>(null)

    useEffect(() => {
        fetchJobs()
        fetchCategories()
    }, [])

    const fetchJobs = async () => {
        try {
            const res = await fetch('/api/rss/jobs')
            const data = await res.json()
            if (data.success) {
                setJobs(data.jobs || [])
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories')
            const data = await res.json()
            if (Array.isArray(data)) {
                setCategories(data)
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }

    const handleSubmitJob = async () => {
        const effectiveRssUrl = formData.manualRssUrl || formData.rssUrl
        const isNoRssRequirement = formData.jobType === 'smart_trend' || formData.jobType === 'keyword_watcher'

        if (!formData.name || (!isNoRssRequirement && !effectiveRssUrl)) {
            alert('Nama job dan RSS URL wajib diisi!')
            return
        }

        if (formData.jobType === 'keyword_watcher' && !formData.searchKeyword) {
            alert('Kata kunci wajib diisi untuk Keyword Watcher!')
            return
        }

        setCreating(true)
        const payload = {
            ...formData,
            id: editingJobId,
            rssUrl: formData.manualRssUrl || formData.rssUrl
        }

        try {
            const res = await fetch('/api/rss/jobs', {
                method: editingJobId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                if (!editingJobId) {
                    setNewJobUrl(data.job.triggerUrl)
                } else {
                    alert('✅ Job updated successfully!')
                    setEditingJobId(null)
                    setShowCreateForm(false)
                }

                fetchJobs()
                resetForm()
            } else {
                alert('Error: ' + data.error)
            }
        } catch (err: any) {
            alert(`Failed to ${editingJobId ? 'update' : 'create'} job: ` + err.message)
        } finally {
            setCreating(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            rssUrl: '',
            manualRssUrl: '',
            categoryId: '',
            isPublished: true,
            showSourceAttribution: true,
            useAIImage: false,
            maxArticlesPerRun: 3,
            targetLanguage: 'id',
            writingStyle: 'Professional',
            articleModel: 'Straight News',
            jobType: 'standard',
            searchKeyword: '',
            trendRegion: 'local',
            trendNiche: 'any',
            thumbnailPriority: 'ai_priority'
        })
    }

    const copyUrl = (taskKey: string) => {
        const url = `${window.location.origin}/api/rss/cron/${taskKey}`
        navigator.clipboard.writeText(url)
        alert('✅ URL copied to clipboard!')
    }

    const toggleJobStatus = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch('/api/rss/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !isActive })
            })
            const data = await res.json()
            if (data.success) {
                fetchJobs()
            }
        } catch (err) {
            console.error('Failed to toggle job:', err)
        }
    }

    const handleTestJob = async (taskKey: string) => {
        if (!confirm('Jalankan job ini sekarang? (Manual Trigger)')) return

        try {
            alert('⏳ Sedang menjalankan job... Mohon tunggu.')
            const res = await fetch(`/api/rss/cron/${taskKey}`)
            const data = await res.json()

            if (data.success) {
                alert(`✅ Sukses! ${data.articlesPublished} artikel dipublish.\nWaktu: ${data.executionTime}`)
                fetchJobs()
            } else {
                alert('❌ Gagal: ' + data.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const deleteJob = async (id: string) => {
        if (!confirm('Yakin ingin menghapus job ini?')) return

        try {
            const res = await fetch(`/api/rss/jobs?id=${id}`, {
                method: 'DELETE'
            })
            const data = await res.json()
            if (data.success) {
                fetchJobs()
            }
        } catch (err) {
            console.error('Failed to delete job:', err)
        }
    }

    const handleEditClick = (job: RSSJob) => {
        setEditingJobId(job.id)
        setFormData({
            name: job.name,
            rssUrl: job.rss_url,
            manualRssUrl: job.rss_url, // Populate both just in case
            categoryId: job.category_id || '',
            isPublished: job.is_published,
            showSourceAttribution: job.show_source_attribution,
            useAIImage: job.use_ai_image,
            maxArticlesPerRun: job.max_articles_per_run,
            targetLanguage: job.target_language,
            writingStyle: job.writing_style,
            articleModel: job.article_model,
            jobType: job.job_type,
            searchKeyword: job.search_keyword || '',
            trendRegion: job.trend_region,
            trendNiche: job.trend_niche,
            thumbnailPriority: job.thumbnail_priority
        })
        setShowCreateForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setEditingJobId(null)
        resetForm()
        setShowCreateForm(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">RSS Auto-Jobs</h1>
                    <p className="text-gray-600">Automated RSS article publishing with cron triggers</p>
                </div>
                <button
                    onClick={() => {
                        if (editingJobId) {
                            handleCancelEdit()
                        } else {
                            setShowCreateForm(!showCreateForm)
                        }
                    }}
                    className="px-4 py-2 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#990000]/90 flex items-center gap-2"
                >
                    {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showCreateForm ? 'Close Form' : 'New Job'}
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4">Create New Auto-Job</h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Job Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., CNN Tech Auto-Publisher"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block text-blue-700">Jenis Job (Automation Level)</label>
                                <select
                                    value={formData.jobType}
                                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                                    className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-600 font-bold"
                                >
                                    <option value="standard">📄 Standard RSS (Feed URL Tunggal)</option>
                                    <option value="smart_trend">🤖 Trigger Otomatis (Riset Tren Sesuai Niche)</option>
                                    <option value="keyword_watcher">🔍 Trigger Manual (Search via Kata Kunci)</option>
                                </select>
                            </div>
                        </div>

                        {formData.jobType === 'keyword_watcher' && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                                <label className="text-sm font-bold text-purple-800 flex items-center gap-2">
                                    <Search className="w-4 h-4" /> Kata Kunci Utama (Trigger)
                                </label>
                                <input
                                    type="text"
                                    value={formData.searchKeyword}
                                    onChange={(e) => setFormData({ ...formData, searchKeyword: e.target.value })}
                                    placeholder="Contoh: Arsenal vs MU, Kenaikan Harga Beras, IKN"
                                    className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-600 font-bold"
                                />
                                <p className="text-xs text-purple-600 italic">
                                    Sistem akan mencari kata kunci ini secara spesifik di Google News dan media lokal untuk membuat laporan berita orisinal.
                                </p>
                            </div>
                        )}

                        {formData.jobType === 'smart_trend' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" />
                                    <strong>Mode Otomatis Aktif:</strong> Sistem akan melakukan riset kata kunci populer secara otomatis berdasarkan <strong>Niche</strong> dan <strong>Region</strong> yang Anda pilih di bawah. Anda tidak perlu memasukkan kata kunci manual.
                                </p>
                            </div>
                        )}

                        {formData.jobType === 'standard' && (
                            <>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">RSS Feed URL</label>
                                    <select
                                        value={formData.rssUrl}
                                        onChange={(e) => setFormData({ ...formData, rssUrl: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                                    >
                                        <option value="">-- Select RSS Feed --</option>
                                        {RSS_FEEDS.map(feed => (
                                            <option key={feed.id} value={feed.url}>
                                                {feed.name} ({feed.category})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block text-red-700">Atau Input Manual RSS URL (Prioritas)</label>
                                    <input
                                        type="url"
                                        value={formData.manualRssUrl}
                                        onChange={(e) => setFormData({ ...formData, manualRssUrl: e.target.value })}
                                        placeholder="https://example.com/rss atau kosongkan"
                                        className="w-full px-4 py-2 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                                    />
                                    <p className="text-xs text-red-600 mt-1 italic">
                                        *Jika bagian ini diisi, maka pilihan drop-down di atas akan diabaikan.
                                    </p>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block">Category</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                            >
                                <option value="">-- Select Category --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Publish Status</label>
                                <select
                                    value={formData.isPublished ? 'publish' : 'draft'}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.value === 'publish' })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                                >
                                    <option value="publish">📢 Auto-Publish (Live)</option>
                                    <option value="draft">📝 Save as Draft</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Max Articles/Run</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.maxArticlesPerRun}
                                    onChange={(e) => setFormData({ ...formData, maxArticlesPerRun: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showSourceAttr"
                                    checked={formData.showSourceAttribution}
                                    onChange={(e) => setFormData({ ...formData, showSourceAttribution: e.target.checked })}
                                    className="w-4 h-4 text-[#990000] border-gray-300 rounded focus:ring-[#990000]"
                                />
                                <label htmlFor="showSourceAttr" className="text-sm text-gray-700 font-medium cursor-pointer">
                                    Tampilkan "Sumber: [Nama RSS]" di bawah artikel?
                                </label>
                            </div>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                            <label className="text-sm font-bold text-purple-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Thumbnail & Image Strategy
                            </label>
                            <select
                                value={formData.thumbnailPriority}
                                onChange={(e) => setFormData({ ...formData, thumbnailPriority: e.target.value })}
                                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-600 font-bold"
                            >
                                <option value="ai_priority">✨ AI Priority (Generated first, source as fallback)</option>
                                <option value="source_priority">📸 Source Priority (Original first, AI as fallback)</option>
                                <option value="source_only">🔍 Source Only (Original "Real Pict" Only - No AI)</option>
                            </select>
                            <p className="text-xs text-purple-600 italic">
                                *Pilih <strong>Source Only</strong> jika Anda ingin artikel selalu menggunakan gambar asli dari berita sumber (Penting untuk review produk).
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block border-l-4 border-blue-600 pl-3">Target Bahasa AI</label>
                                <select
                                    value={formData.targetLanguage}
                                    onChange={(e) => setFormData({ ...formData, targetLanguage: e.target.value })}
                                    className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-600 font-bold"
                                >
                                    <option value="id">🇮🇩 Bahasa Indonesia</option>
                                    <option value="en">🇺🇸 Bahasa Inggris (English)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block border-l-4 border-purple-600 pl-3">Gaya Penulisan</label>
                                <select
                                    value={formData.writingStyle}
                                    onChange={(e) => setFormData({ ...formData, writingStyle: e.target.value })}
                                    className="w-full px-4 py-2 border border-purple-200 bg-purple-50 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-600 font-bold"
                                >
                                    <option value="Professional">👔 Professional</option>
                                    <option value="Casual">☕ Casual / Santai</option>
                                    <option value="Investigative">🔍 Investigative</option>
                                    <option value="Educational">🎓 Educational / Edukasi</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-2 block border-l-4 border-amber-600 pl-3">Model Berita (Struktur)</label>
                            <select
                                value={formData.articleModel}
                                onChange={(e) => setFormData({ ...formData, articleModel: e.target.value })}
                                className="w-full px-4 py-2 border border-amber-200 bg-amber-50 rounded-lg focus:ring-2 focus:ring-amber-200 focus:border-amber-600 font-bold"
                            >
                                <option value="Straight News">📰 Straight News (Lugas & Cepat)</option>
                                <option value="Feature/Narasi">📖 Feature / Narasi (Bercerita)</option>
                                <option value="Opinion/Analisis">🧠 Opinion / Analisis (Mendalam)</option>
                                <option value="Deep Analysis">🏗️ Deep Analysis (Komprehensif)</option>
                            </select>
                        </div>

                    </div>

                    {(formData.jobType === 'smart_trend' || formData.jobType === 'keyword_watcher') && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div>
                                <label className="text-sm font-bold text-orange-800 mb-2 block flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Target Media Region
                                </label>
                                <select
                                    value={formData.trendRegion}
                                    onChange={(e) => setFormData({ ...formData, trendRegion: e.target.value })}
                                    className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-600 font-bold"
                                >
                                    <option value="local">🇮🇩 Media Lokal (Indonesia)</option>
                                    <option value="western">🇺🇸 Media Barat (English/US)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-orange-800 mb-2 block flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4" /> Fokus Niche (Kategori)
                                </label>
                                <select
                                    value={formData.trendNiche}
                                    onChange={(e) => setFormData({ ...formData, trendNiche: e.target.value })}
                                    className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-600 font-bold"
                                >
                                    <option value="any">🌐 Semua (General News)</option>
                                    <option value="products">📦 Produk (Viral/Shopping)</option>
                                    <option value="technology">💻 Technology</option>
                                    <option value="business">💰 Business / Finance</option>
                                    <option value="sports">⚽ Sports</option>
                                    <option value="entertainment">🎬 Entertainment</option>
                                    <option value="science">🧪 Science</option>
                                    <option value="health">🏥 Health</option>
                                </select>
                            </div>
                            <p className="col-span-2 text-xs text-orange-700 italic">
                                *Pilihan ini menentukan dari media mana sistem akan mencari sumber referensi untuk sintesis berita.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={handleSubmitJob}
                            disabled={creating}
                            className="flex-1 px-6 py-3 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#990000]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {editingJobId ? 'Saving...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    {editingJobId ? <RefreshCw className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    {editingJobId ? 'Save Changes' : 'Create Job'}
                                </>
                            )}
                        </button>
                        {editingJobId && (
                            <button
                                onClick={handleCancelEdit}
                                className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" />
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Success Modal */}
            {newJobUrl && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-bold text-green-900 mb-2">✅ Job Created Successfully!</h3>
                    <p className="text-sm text-green-800 mb-2">Your Cron Trigger URL:</p>
                    <div className="flex gap-2">
                        <code className="flex-1 p-2 bg-white rounded text-xs font-mono overflow-x-auto">
                            {newJobUrl}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(newJobUrl)
                                alert('✅ URL copied!')
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                        Copy this URL and add it to cron-job.org or your preferred cron service
                    </p>
                    <button
                        onClick={() => setNewJobUrl(null)}
                        className="mt-2 text-sm text-green-700 underline hover:text-green-900"
                    >
                        Close
                    </button>
                </div>
            )}

            {/* Jobs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                        <p className="text-gray-500 mt-2">Loading jobs...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500">No auto-jobs created yet. Click "New Job" to get started!</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {jobs.map(job => (
                            <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold">{job.name}</h3>
                                            {job.job_type === 'keyword_watcher' ? (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1">
                                                    <Search className="w-3 h-3" /> Keyword: {job.search_keyword}
                                                </span>
                                            ) : job.job_type === 'smart_trend' ? (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> Smart Trend
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                                                    📄 Standard
                                                </span>
                                            )}
                                            {job.is_active ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                                    🟢 Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                                                    ⏸️ Paused
                                                </span>
                                            )}
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                                {job.is_published ? '📢 Auto-Publish' : '📝 Draft'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Category: {job.categories?.name || 'Default'} •
                                            Max: {job.max_articles_per_run} articles/run •
                                            Style: <span className="text-purple-700 font-bold">{job.writing_style}</span> •
                                            Model: <span className="text-amber-700 font-bold">{job.article_model}</span> •
                                            Language: {job.target_language === 'en' ? '🇺🇸 English' : '🇮🇩 Local'}
                                            {(job.job_type === 'smart_trend' || job.job_type === 'keyword_watcher') && (
                                                <>
                                                    <br />
                                                    <span className="text-orange-700 text-xs font-bold uppercase tracking-wider">
                                                        🎯 Target: {job.trend_region === 'western' ? 'Media Barat' : 'Media Lokal'} •
                                                        Niche: {job.trend_niche === 'any' ? 'General' : job.trend_niche} •
                                                        Img: {job.thumbnail_priority === 'ai_priority' ? 'AI first' : job.thumbnail_priority === 'source_priority' ? 'Source first' : 'Source only'}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(job)}
                                            className="p-2 hover:bg-blue-100 rounded text-blue-600"
                                            title="Edit Job"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleJobStatus(job.id, job.is_active)}
                                            className="p-2 hover:bg-gray-200 rounded"
                                            title={job.is_active ? 'Pause' : 'Resume'}
                                        >
                                            {job.is_active ? (
                                                <Pause className="w-4 h-4" />
                                            ) : (
                                                <Play className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteJob(job.id)}
                                            className="p-2 hover:bg-red-100 rounded text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-4 text-sm text-gray-600 mb-3">
                                    <span>Runs: {job.total_runs}</span>
                                    <span>•</span>
                                    <span>Published: {job.total_articles_published} articles</span>
                                    {job.last_run_at && (
                                        <>
                                            <span>•</span>
                                            <span>Last: {new Date(job.last_run_at).toLocaleString('id-ID')}</span>
                                        </>
                                    )}
                                </div>

                                {/* Trigger URL */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-bold text-gray-500 mb-1">CRON TRIGGER URL:</p>
                                    <div className="flex gap-2">
                                        <code className="flex-1 text-xs font-mono text-gray-700 overflow-x-auto">
                                            {window.location.origin}/api/rss/cron/{job.task_key}
                                        </code>
                                        <button
                                            onClick={() => copyUrl(job.task_key)}
                                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold flex items-center gap-2"
                                        >
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </button>
                                        <button
                                            onClick={() => handleTestJob(job.task_key)}
                                            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-[#990000] text-sm font-bold flex items-center gap-2"
                                            title="Run Job Now (Manual Trigger)"
                                        >
                                            <Play className="w-3 h-3 fill-current" />
                                            Test Run
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    )
}
