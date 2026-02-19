'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus,
    Search,
    FileText,
    Edit2,
    Trash2,
    Globe,
    Loader2,
    X,
    Save,
    Eye,
    ChevronRight,
    AlertCircle,
    Check
} from 'lucide-react'
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@/components/admin/ProEditor'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-50 animate-pulse rounded-2xl" />
})

export default function PagesPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [pages, setPages] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [content, setContent] = useState('')
    const [isPublished, setIsPublished] = useState(true)
    const [isFooter, setIsFooter] = useState(false)

    useEffect(() => {
        fetchPages()
    }, [])

    // Auto-generate slug
    useEffect(() => {
        if (title && !editingId) {
            setSlug(title.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''))
        }
    }, [title, editingId])

    async function fetchPages() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPages(data || [])
        } catch (error) {
            console.error('Error fetching pages:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredPages = pages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    )

    async function handleSave() {
        if (!title || !slug || !content) {
            setMessage({ type: 'error', text: 'Judul, slug, dan konten wajib diisi.' })
            return
        }

        try {
            setSaving(true)
            setMessage(null)

            const pageData = {
                title,
                slug,
                content,
                is_published: isPublished,
                is_footer: isFooter,
                updated_at: new Date().toISOString()
            }

            if (editingId) {
                const { error } = await supabase
                    .from('pages')
                    .update(pageData)
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('pages')
                    .insert([pageData])
                if (error) throw error
            }

            setMessage({ type: 'success', text: `Halaman berhasil ${editingId ? 'diperbarui' : 'dibuat'}!` })
            fetchPages()
            setTimeout(() => {
                setIsModalOpen(false)
                resetForm()
            }, 1000)
        } catch (error: any) {
            console.error('Error saving page:', error)
            setMessage({ type: 'error', text: error.message || 'Gagal menyimpan halaman' })
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm('Apakah Anda yakin ingin menghapus halaman ini?')) return

        try {
            const { error } = await supabase
                .from('pages')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchPages()
        } catch (error: any) {
            alert('Gagal menghapus: ' + error.message)
        }
    }

    function resetForm() {
        setEditingId(null)
        setTitle('')
        setSlug('')
        setContent('')
        setIsPublished(true)
        setIsFooter(false)
        setMessage(null)
    }

    function openEdit(page: any) {
        setEditingId(page.id)
        setTitle(page.title)
        setSlug(page.slug)
        setContent(page.content)
        setIsPublished(page.is_published)
        setIsFooter(page.is_footer || false)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Halaman Statis</h1>
                    <p className="text-slate-500 text-sm mt-1">Buat dan kelola halaman seperti Kebijakan Privasi, Redaksi, dll.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Buat Halaman Baru</span>
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center px-6">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input
                    type="text"
                    placeholder="Cari halaman berdasarkan judul atau slug..."
                    className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-600 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Halaman</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Slug</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                            <p className="text-sm font-medium text-slate-400">Memuat data halaman...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPages.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                                        {searchQuery ? 'Tidak ada halaman yang cocok dengan pencarian.' : 'Belum ada halaman yang dibuat.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPages.map((page) => (
                                    <tr key={page.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{page.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">Dibuat: {new Date(page.created_at).toLocaleDateString('id-ID')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">/p/{page.slug}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            {page.is_published ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-500 uppercase tracking-widest">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end space-x-2">
                                                <a
                                                    href={`/p/${page.slug}`}
                                                    target="_blank"
                                                    className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Lihat Live"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => openEdit(page)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(page.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)} />

                    <div className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
                                    {editingId ? 'Edit Halaman' : 'Buat Halaman Baru'}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Lengkapi konten halaman Anda di bawah ini.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                            {message && (
                                <div className={`p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                    {message.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                    <p className="text-sm font-bold">{message.text}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            Judul Halaman <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[20px] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-sm font-bold placeholder:text-slate-400"
                                            placeholder="Contoh: Kebijakan Privasi"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            Slug URL <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-[20px] px-6 py-4">
                                            <span className="text-slate-400 text-sm font-medium">/p/</span>
                                            <input
                                                type="text"
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                className="bg-transparent border-none focus:ring-0 text-sm font-mono w-full p-0"
                                                placeholder="kebijakan-privasi"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settings</label>
                                        <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-900">Publikasikan Halaman</p>
                                                    <p className="text-[10px] text-slate-500">Tampilkan halaman ini ke publik.</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsPublished(!isPublished)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${isPublished ? 'bg-primary shadow-inner shadow-black/10' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isPublished ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-900">Tampilkan di Footer</p>
                                                    <p className="text-[10px] text-slate-500">Munculkan link di bagian 'Informasi' footer.</p>
                                                </div>
                                                <button
                                                    onClick={() => setIsFooter(!isFooter)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${isFooter ? 'bg-indigo-500 shadow-inner shadow-black/10' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isFooter ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    Konten Halaman <span className="text-rose-500">*</span>
                                </label>
                                <div className="border border-slate-100 rounded-[24px] overflow-hidden min-h-[400px]">
                                    <Editor
                                        value={content}
                                        onChange={setContent}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={saving}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                <span>{editingId ? 'Simpan Perubahan' : 'Buat Halaman'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
