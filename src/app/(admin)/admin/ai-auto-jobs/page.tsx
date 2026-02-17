'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, CheckCircle, AlertCircle, Play, Pause, Trash2, Copy, Sparkles, Layout, Type } from 'lucide-react'

interface AIJob {
    id: string
    name: string
    task_key: string
    theme: string
    category_id: string | null
    categories?: { name: string }
    style: string
    model_type: string
    generate_image: boolean
    is_published: boolean
    articles_per_run: number
    is_active: boolean
    last_run_at: string | null
    last_run_status: string | null
    total_runs: number
    total_articles_generated: number
    created_at: string
}

const NEWS_STYLES = ['Formal', 'Santai', 'Investigatif', 'Provokatif', 'Inspiratif']
const NEWS_MODELS = ['Breaking News', 'Feature Story', 'Opinion', 'Interview', 'Editorial']

export default function AIAutoJobsPage() {
    const [jobs, setJobs] = useState<AIJob[]>([])
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
    const [loading, setLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        theme: '',
        categoryId: '',
        style: 'Formal',
        modelType: 'Breaking News',
        generateImage: true,
        isPublished: true,
        articlesPerRun: 1
    })
    const [creating, setCreating] = useState(false)
    const [newJobUrl, setNewJobUrl] = useState<string | null>(null)

    useEffect(() => {
        fetchJobs()
        fetchCategories()
    }, [])

    const fetchJobs = async () => {
        try {
            const res = await fetch('/api/ai/auto-jobs')
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
                if (data.length > 0) setFormData(prev => ({ ...prev, categoryId: data[0].id }))
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }

    const handleCreateJob = async () => {
        if (!formData.name || !formData.theme) {
            alert('Nama job dan Tema wajib diisi!')
            return
        }

        setCreating(true)
        try {
            const res = await fetch('/api/ai/auto-jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (data.success) {
                setNewJobUrl(data.job.triggerUrl)
                fetchJobs()
                setFormData({
                    name: '',
                    theme: '',
                    categoryId: categories[0]?.id || '',
                    style: 'Formal',
                    modelType: 'Breaking News',
                    generateImage: true,
                    isPublished: true,
                    articlesPerRun: 1
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

    const toggleJobStatus = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch('/api/ai/auto-jobs', {
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
        if (!confirm('Jalankan generator AI ini sekarang? (Manual Trigger)')) return

        try {
            alert('⏳ AI sedang berpikir dan menulis... Mohon tunggu (bisa 10-20 detik).')
            const res = await fetch(`/api/ai/cron/${taskKey}`)
            const data = await res.json()

            if (data.success) {
                alert(`✅ Sukses! Artikel baru telah di-generate.\nWaktu: ${data.executionTime}`)
                fetchJobs()
            } else {
                alert('❌ Gagal: ' + data.error)
            }
        } catch (err: any) {
            alert('Error: ' + err.message)
        }
    }

    const deleteJob = async (id: string) => {
        if (!confirm('Yakin ingin menghapus job AI ini?')) return

        try {
            const res = await fetch(`/api/ai/auto-jobs?id=${id}`, {
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
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-purple-600" />
                        AI Auto-Writer Jobs
                    </h1>
                    <p className="text-gray-600">Otomatisasi pembuatan artikel berkualitas tinggi secara berkala</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New AI Job
                </button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-purple-600" />
                        Buat Job AI Baru
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Nama Job</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Berita Tech Otomatis"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Tema Utama (Prompt Dasar)</label>
                                <textarea
                                    value={formData.theme}
                                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                    placeholder="Topik spesifik yang ingin diangkat oleh AI..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Kategori</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-bold"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">Gaya</label>
                                    <select
                                        value={formData.style}
                                        onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs font-bold"
                                    >
                                        {NEWS_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block">Model</label>
                                    <select
                                        value={formData.modelType}
                                        onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs font-bold"
                                    >
                                        {NEWS_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-100 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={formData.generateImage}
                                        onChange={(e) => setFormData({ ...formData, generateImage: e.target.checked })}
                                        className="w-4 h-4 text-purple-600"
                                    />
                                    <span className="text-xs font-bold">Thumbnail AI</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-100 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                        className="w-4 h-4 text-purple-600"
                                    />
                                    <span className="text-xs font-bold">Auto Publish</span>
                                </label>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block">Jumlah Artikel / Run</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.articlesPerRun}
                                    onChange={(e) => setFormData({ ...formData, articlesPerRun: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-bold"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 italic">*Maksimal 5 artikel per sekali jalan untuk menjaga kualitas.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="px-6 py-2 text-gray-500 font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateJob}
                            disabled={creating}
                            className="px-8 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Create Job
                        </button>
                    </div>

                    {/* New Job URL */}
                    {newJobUrl && (
                        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h3 className="font-bold text-purple-900 mb-2">✅ Job Berhasil Dibuat!</h3>
                            <p className="text-sm text-purple-800 mb-2">Gunakan URL ini di cron-job.org:</p>
                            <div className="flex gap-2">
                                <code className="flex-1 p-2 bg-white rounded text-xs font-mono overflow-auto border border-purple-100 italic">
                                    {newJobUrl}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(newJobUrl)
                                        alert('URL disalin!')
                                    }}
                                    className="px-3 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Jobs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="font-bold flex items-center gap-2">
                        <Layout className="w-4 h-4 text-gray-400" />
                        Active AI Jobs
                    </h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{jobs.length} Jobs Total</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
                        <p className="text-gray-500 mt-2 font-bold">Memuat daftar job...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                            <Type className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-400 font-bold">Belum ada Job AI Otomatis</h3>
                        <p className="text-gray-400 text-sm mt-1 text-balance">Mulai dengan membuat Job baru untuk menulis artikel otomatis.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {jobs.map(job => (
                            <div key={job.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black tracking-tight">{job.name}</h3>
                                            <div className="flex gap-1.5">
                                                {job.is_active ? (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider rounded">Active</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-wider rounded">Paused</span>
                                                )}
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider rounded">{job.model_type}</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded">{job.style}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-bold">
                                            <span className="flex items-center gap-1">Category: <span className="text-black">{job.categories?.name || 'Uncategorized'}</span></span>
                                            <span className="flex items-center gap-1 text-purple-600 underline">Theme: {job.theme.substring(0, 50)}...</span>
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-black text-[10px]">Qty: {job.articles_per_run} art</span>
                                            <span>Runs: {job.total_runs}</span>
                                            <span>Generated: {job.total_articles_generated}</span>
                                        </div>
                                        {job.last_run_at && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                                <span className="text-gray-400 uppercase tracking-widest">Last Run:</span>
                                                <span className="text-gray-600">{new Date(job.last_run_at).toLocaleString('id-ID')}</span>
                                                {job.last_run_status === 'success' ? (
                                                    <span className="text-green-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Success</span>
                                                ) : (
                                                    <span className="text-red-500 flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> Failed</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleTestJob(job.task_key)}
                                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 text-purple-600 shadow-sm transition-all"
                                            title="Run Now"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                        </button>
                                        <button
                                            onClick={() => toggleJobStatus(job.id, job.is_active)}
                                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 shadow-sm transition-all"
                                            title={job.is_active ? 'Pause' : 'Resume'}
                                        >
                                            {job.is_active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/api/ai/cron/${job.task_key}`
                                                navigator.clipboard.writeText(url)
                                                alert('URL disalin!')
                                            }}
                                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 shadow-sm transition-all"
                                            title="Copy Trigger URL"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteJob(job.id)}
                                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 text-red-600 shadow-sm transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
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
