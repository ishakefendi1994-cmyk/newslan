'use client'

import { useState, useEffect } from 'react'
import { Key, Plus, Search, Trash2, Edit2, Loader2, Check, AlertCircle, Shield, Globe, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLicensesPage() {
    const supabase = createClient()
    const [licenses, setLicenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [pinInput, setPinInput] = useState('')
    const [pinError, setPinError] = useState(false)
    const SECURE_PIN = 'flazz2026'
    const [newLicenseData, setNewLicenseData] = useState({
        client_name: '',
        max_domains: 1,
        notes: '',
        expires_at: ''
    })
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        if (isUnlocked) {
            fetchLicenses()
        }
    }, [isUnlocked])

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault()
        if (pinInput === SECURE_PIN) {
            setIsUnlocked(true)
            setPinError(false)
        } else {
            setPinError(true)
            setPinInput('')
        }
    }

    async function fetchLicenses() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('plugin_licenses')
                .select('*, license_activations(count)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setLicenses(data || [])
        } catch (error) {
            console.error('Error fetching licenses:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerate() {
        if (!newLicenseData.client_name) {
            alert('Nama Client wajib diisi.')
            return
        }

        try {
            setGenerating(true)
            const response = await fetch('/api/license/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLicenseData)
            })

            const result = await response.json()
            if (!result.success) throw new Error(result.message)

            alert(`Lisensi Berhasil Dibuat!\n\nKey: ${result.data.license_key}`)
            setShowModal(false)
            setNewLicenseData({ client_name: '', max_domains: 1, notes: '', expires_at: '' })
            fetchLicenses()
        } catch (error: any) {
            console.error('Generation Error:', error)
            alert('Gagal membuat lisensi: ' + error.message)
        } finally {
            setGenerating(false)
        }
    }

    async function toggleStatus(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
        try {
            const { error } = await supabase
                .from('plugin_licenses')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error
            fetchLicenses()
        } catch (error) {
            console.error('Status Update Error:', error)
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Hapus lisensi ini? Semua aktivasi terkait juga akan terputus.')) return
        try {
            const { error } = await supabase.from('plugin_licenses').delete().eq('id', id)
            if (error) throw error
            fetchLicenses()
        } catch (error) {
            console.error('Delete Error:', error)
        }
    }

    const filteredLicenses = licenses.filter(l =>
        l.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.license_key.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (!isUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
                            <Shield className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Area Terbatas</h2>
                        <p className="text-slate-500 text-sm">Halaman ini berisi akses rahasia lisensi client. Masukkan PIN keamanan untuk melanjutkan.</p>
                    </div>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="space-y-2">
                            <input
                                type="password"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                placeholder="Masukkan PIN..."
                                className={`w-full text-center tracking-widest px-4 py-4 rounded-xl bg-slate-50 border-2 focus:bg-white focus:outline-none transition-all text-lg font-mono ${pinError ? 'border-rose-300 focus:border-rose-500 text-rose-600' : 'border-transparent focus:border-primary/50'}`}
                                autoFocus
                            />
                            {pinError && <p className="text-rose-500 text-xs font-medium text-center animate-pulse">PIN tidak valid!</p>}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg"
                        >
                            <Key className="w-5 h-5" />
                            <span>Buka Gembok</span>
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plugin Licenses</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola lisensi Flazz AI Client Bapak.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Generate New License</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3 text-primary mb-2">
                        <Shield className="w-5 h-5" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Licenses</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{licenses.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3 text-indigo-500 mb-2">
                        <Globe className="w-5 h-5" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Domain Active</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        {licenses.reduce((acc, l) => acc + (l.license_activations?.[0]?.count || 0), 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3 text-emerald-500 mb-2">
                        <Users className="w-5 h-5" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Sehat</p>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        {licenses.filter(l => l.status === 'active').length} Active
                    </p>
                </div>
            </div>

            {/* License Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari client atau key..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 focus:ring-0 text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Client / Key</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Activations</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Last Verified</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && licenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                                        <span className="text-sm font-medium">Loading licenses...</span>
                                    </td>
                                </tr>
                            ) : filteredLicenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Shield className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <span className="text-sm font-medium">Belum ada lisensi.</span>
                                    </td>
                                </tr>
                            ) : filteredLicenses.map((l) => (
                                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 tracking-tight">{l.client_name || 'Unnamed Client'}</p>
                                            <code className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-1 inline-block uppercase font-mono tracking-wider">
                                                {l.license_key}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-sm font-bold ${l.license_activations?.[0]?.count >= l.max_domains ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {l.license_activations?.[0]?.count || 0} / {l.max_domains}
                                            </span>
                                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${l.license_activations?.[0]?.count >= l.max_domains ? 'bg-rose-500' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(100, ((l.license_activations?.[0]?.count || 0) / l.max_domains) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${l.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-slate-500">
                                            {l.last_verified_at ? new Date(l.last_verified_at).toLocaleString('id-ID') : 'Never'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleStatus(l.id, l.status)}
                                                className={`p-2 rounded-xl border transition-all ${l.status === 'active'
                                                    ? 'hover:bg-rose-50 border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-600'
                                                    : 'hover:bg-emerald-50 border-transparent hover:border-emerald-100 text-slate-400 hover:text-emerald-600'
                                                    }`}
                                                title={l.status === 'active' ? 'Suspend' : 'Activate'}
                                            >
                                                {l.status === 'active' ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(l.id)}
                                                className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all text-slate-400 hover:text-rose-600"
                                                title="Hard Delete"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Setup */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Generate New License</h2>
                            <p className="text-slate-500 text-sm mt-1">Buat lisensi Flazz AI untuk client baru.</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Client Name</label>
                                <input
                                    type="text"
                                    value={newLicenseData.client_name}
                                    onChange={e => setNewLicenseData({ ...newLicenseData, client_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                                    placeholder="Contoh: Digital Agency Jakarta"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Max Domains (Kuota Website)</label>
                                <input
                                    type="number"
                                    value={newLicenseData.max_domains}
                                    onChange={e => setNewLicenseData({ ...newLicenseData, max_domains: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                                    min="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Notes (Opsional)</label>
                                <textarea
                                    value={newLicenseData.notes}
                                    onChange={e => setNewLicenseData({ ...newLicenseData, notes: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm h-24 resize-none"
                                    placeholder="Detail paket atau catatan client..."
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end space-x-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                <span>Generate License Key</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
