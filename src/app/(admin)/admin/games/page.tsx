'use client'

import { useState } from 'react'
import { RefreshCw, Plus, Trash2, Star, Eye, EyeOff, Gamepad2, CheckCircle, AlertCircle } from 'lucide-react'

type Game = {
    id: string
    title: string
    slug: string
    category: string
    thumbnail: string | null
    embed_url: string
    play_count: number
    is_featured: boolean
    is_active: boolean
    is_manual: boolean
    source: string
    created_at: string
}

interface SyncResult {
    success: boolean
    message?: string
    total?: number
    inserted?: number
    failed?: number
    error?: string
}

export default function AdminGamesPage() {
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [searchQ, setSearchQ] = useState('')
    const [loaded, setLoaded] = useState(false)

    // Form state
    const [form, setForm] = useState({
        title: '', slug: '', description: '', embed_url: '',
        thumbnail: '', category: 'Arcade', width: '800', height: '600',
    })

    const loadGames = async (s = '') => {
        setLoading(true)
        try {
            const res = await fetch(`/api/games?limit=50&search=${s}`)
            const json = await res.json()
            setGames(json.data || [])
            setLoaded(true)
        } finally {
            setLoading(false)
        }
    }

    const handleSync = async (amount = 500) => {
        setSyncing(true)
        setSyncResult(null)
        try {
            const res = await fetch('/api/games/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            })
            const data = await res.json()
            setSyncResult(data)
            if (data.success) loadGames()
        } catch {
            setSyncResult({ success: false, error: 'Gagal terhubung ke server' })
        } finally {
            setSyncing(false)
        }
    }

    const handleToggle = async (id: string, field: 'is_featured' | 'is_active', current: boolean) => {
        await fetch(`/api/admin/games/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: !current }),
        })
        setGames(prev => prev.map(g => g.id === id ? { ...g, [field]: !current } : g))
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus game ini?')) return
        await fetch(`/api/admin/games/${id}`, { method: 'DELETE' })
        setGames(prev => prev.filter(g => g.id !== id))
    }

    const generateSlug = (title: string) =>
        title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)

    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                slug: form.slug || generateSlug(form.title),
                width: parseInt(form.width) || 800,
                height: parseInt(form.height) || 600,
                is_manual: true,
                source: 'manual',
            }),
        })
        if (res.ok) {
            setShowForm(false)
            setForm({ title: '', slug: '', description: '', embed_url: '', thumbnail: '', category: 'Arcade', width: '800', height: '600' })
            loadGames()
        }
    }

    const categories = ['Action', 'Adventure', 'Arcade', 'Casual', 'Girls', 'Hypercasual', 'Puzzle', 'Racing', 'Shooting', 'Sports']

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Gamepad2 className="w-6 h-6 text-indigo-600" />
                    <h1 className="text-2xl font-black">Kelola Game Portal</h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold"
                    >
                        <Plus className="w-4 h-4" /> Tambah Manual
                    </button>
                    <button
                        onClick={() => handleSync(500)}
                        disabled={syncing}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Menyinkronkan...' : '🔄 Sync 500 Game'}
                    </button>
                </div>
            </div>

            {/* Sync Result Toast */}
            {syncResult && (
                <div className={`flex items-start gap-3 p-4 rounded-xl ${syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    {syncResult.success
                        ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    }
                    <div>
                        <p className={`font-bold text-sm ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                            {syncResult.success ? '✅ Sync Berhasil!' : '❌ Sync Gagal'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{syncResult.message || syncResult.error}</p>
                        {syncResult.success && (
                            <p className="text-xs text-gray-500">Total: {syncResult.total} | Diproses: {syncResult.inserted} | Gagal: {syncResult.failed}</p>
                        )}
                    </div>
                    <button onClick={() => setSyncResult(null)} className="ml-auto text-gray-400 hover:text-gray-600 text-xs">✕</button>
                </div>
            )}

            {/* Manual Add Form */}
            {showForm && (
                <form onSubmit={handleManualAdd} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
                    <h2 className="font-black text-lg">Tambah Game Manual</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Judul Game *</label>
                            <input required value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value, slug: generateSlug(e.target.value) })) }}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Slug (auto-fill)</label>
                            <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Embed URL (iframe src) *</label>
                            <input required value={form.embed_url} onChange={e => setForm(p => ({ ...p, embed_url: e.target.value }))}
                                placeholder="https://html5.gamemonetize.co/..."
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">URL Thumbnail</label>
                            <input value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Kategori</label>
                            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                                {categories.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Deskripsi</label>
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700">Simpan Game</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold">Batal</button>
                    </div>
                </form>
            )}

            {/* Load & Search */}
            {!loaded ? (
                <div className="flex items-center gap-4">
                    <button onClick={() => loadGames()} className="px-5 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700">
                        Tampilkan Daftar Game
                    </button>
                </div>
            ) : (
                <div className="flex gap-3">
                    <input
                        value={searchQ}
                        onChange={e => { setSearchQ(e.target.value); loadGames(e.target.value) }}
                        placeholder="Cari game..."
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button onClick={() => loadGames(searchQ)} className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-semibold hover:bg-gray-200">
                        Cari
                    </button>
                </div>
            )}

            {/* Games Table */}
            {loaded && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Loading...</div>
                    ) : games.length === 0 ? (
                        <div className="p-12 text-center">
                            <Gamepad2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Belum ada game. Klik "Sync 500 Game" untuk mulai.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">Game</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Kategori</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Sumber</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Aktif</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Featured</th>
                                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {games.map(game => (
                                        <tr key={game.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {game.thumbnail && (
                                                        <img src={game.thumbnail} alt={game.title} className="w-10 h-8 object-cover rounded-lg flex-shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900 line-clamp-1">{game.title}</p>
                                                        <p className="text-xs text-gray-400">{game.play_count} plays</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">{game.category}</span>
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${game.is_manual ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                    {game.is_manual ? 'Manual' : game.source}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggle(game.id, 'is_active', game.is_active)}
                                                    className={`p-1.5 rounded-lg transition-colors ${game.is_active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 bg-gray-100 hover:bg-gray-200'}`}
                                                >
                                                    {game.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggle(game.id, 'is_featured', game.is_featured)}
                                                    className={`p-1.5 rounded-lg transition-colors ${game.is_featured ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-300 bg-gray-100 hover:bg-gray-200'}`}
                                                >
                                                    <Star className="w-4 h-4" fill={game.is_featured ? 'currentColor' : 'none'} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDelete(game.id)}
                                                    className="p-1.5 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
