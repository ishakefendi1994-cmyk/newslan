'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Copy, Trash2, Plus, Loader2, CheckCircle, AlertCircle, ExternalLink, Sparkles } from 'lucide-react'
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
        maxArticlesPerRun: 3
    })
    const [creating, setCreating] = useState(false)
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

    const handleCreateJob = async () => {
        const effectiveRssUrl = formData.manualRssUrl || formData.rssUrl

        if (!formData.name || !effectiveRssUrl) {
            alert('Nama job dan RSS URL wajib diisi!')
            return
        }

        setCreating(true)
        const payload = {
            ...formData,
            rssUrl: formData.manualRssUrl || formData.rssUrl
        }

        try {
            const res = await fetch('/api/rss/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (data.success) {
                setNewJobUrl(data.job.triggerUrl)
                fetchJobs()
                setFormData({
                    name: '',
                    rssUrl: '',
                    manualRssUrl: '',
                    categoryId: '',
                    isPublished: true,
                    showSourceAttribution: true,
                    useAIImage: false,
                    maxArticlesPerRun: 3
                })
            } else {
                alert('Error: ' + data.error)
            }
        } catch (err: any) {
            alert('Failed to create job: ' + err.message)
        } finally {
            setCreating(false)
        }
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black">RSS Auto-Jobs</h1>
                    <p className="text-gray-600">Automated RSS article publishing with cron triggers</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#990000]/90 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Job
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4">Create New Auto-Job</h2>

                    <div className="space-y-4">
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

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                <input
                                    type="checkbox"
                                    id="useAIImage"
                                    checked={formData.useAIImage}
                                    onChange={(e) => setFormData({ ...formData, useAIImage: e.target.checked })}
                                    className="w-4 h-4 text-[#990000] border-gray-300 rounded focus:ring-[#990000]"
                                />
                                <label htmlFor="useAIImage" className="text-sm text-gray-700 font-medium cursor-pointer flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    Gunakan AI untuk Thumbnail? (Replicate)
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateJob}
                            disabled={creating}
                            className="w-full px-6 py-3 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#990000]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Create Job
                                </>
                            )}
                        </button>
                    </div>

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
                                            Max: {job.max_articles_per_run} articles/run
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
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
        </div>
    )
}
