'use client'

import { useState, useEffect } from 'react'
import {
    Megaphone,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Calendar,
    User,
    ArrowUpRight,
    Download,
    X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import NextImage from 'next/image'

export default function AdminComplaintsPage() {
    const supabase = createClient()
    const [complaints, setComplaints] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    useEffect(() => {
        fetchComplaints()
    }, [])

    const fetchComplaints = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('complaints')
                .select(`
                    *,
                    profiles (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setComplaints(data || [])
        } catch (error: any) {
            console.error('Error fetching complaints:', error)
            alert('Gagal mengambil data aduan. Pastikan tabel "complaints" sudah dibuat di Supabase SQL Editor. Error: ' + (error?.message || JSON.stringify(error)))
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error

            setComplaints(complaints.map(c =>
                c.id === id ? { ...c, status: newStatus } : c
            ))
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const deleteComplaint = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus aduan ini?')) return

        try {
            const { error } = await supabase
                .from('complaints')
                .delete()
                .eq('id', id)

            if (error) throw error
            setComplaints(complaints.filter(c => c.id !== id))
        } catch (error) {
            console.error('Error deleting complaint:', error)
        }
    }

    const downloadImage = async (url: string, filename: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement('a')
            link.href = window.URL.createObjectURL(blob)
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            console.error('Download error:', error)
            alert('Gagal mendownload gambar.')
        }
    }

    const filteredComplaints = complaints.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200'
            default: return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />
            case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />
            case 'resolved': return <CheckCircle2 className="w-4 h-4" />
            case 'rejected': return <AlertCircle className="w-4 h-4" />
            default: return <Clock className="w-4 h-4" />
        }
    }

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daftar Aduan User</h1>
                    <p className="text-slate-500 mt-1 font-medium">Kelola dan tanggapi laporan keluhan dari pembaca.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={fetchComplaints}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Clock className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari berdasarkan judul atau nama user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-600 outline-none"
                    />
                </div>
                <div className="flex items-center space-x-3 w-full lg:w-auto">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border-none rounded-2xl px-6 py-3 font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer min-w-[160px]"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Tertunda</option>
                        <option value="processing">Diproses</option>
                        <option value="resolved">Selesai</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>
            </div>

            {/* Complaints List */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat data aduan...</p>
                    </div>
                ) : filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => (
                        <div key={complaint.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Thumbnail */}
                                {complaint.image_url ? (
                                    <div className="w-full lg:w-48 h-48 rounded-3xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                                        <NextImage
                                            src={complaint.image_url}
                                            alt={complaint.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => setSelectedImage(complaint.image_url)}
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
                                                title="Lihat Full"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => downloadImage(complaint.image_url, `aduan-${complaint.id}.jpg`)}
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all"
                                                title="Download"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full lg:w-48 h-48 rounded-3xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                                        <Megaphone className="w-12 h-12 text-slate-200" />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 ${getStatusStyle(complaint.status)}`}>
                                            {getStatusIcon(complaint.status)}
                                            <span>{complaint.status}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(complaint.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{complaint.title}</h3>
                                        <div className="flex items-center space-x-2 mt-2 text-slate-500 font-bold text-sm">
                                            <User className="w-4 h-4 text-slate-400" />
                                            <span>{complaint.profiles?.full_name || 'User Tanpa Nama'}</span>
                                        </div>
                                    </div>

                                    <p className="text-slate-500 leading-relaxed max-w-2xl">{complaint.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col justify-between py-2 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-8 mt-4 lg:mt-0 pt-6 lg:pt-0">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center lg:text-left">Aksi Cepat</p>
                                        <div className="flex lg:flex-col gap-3">
                                            <button
                                                onClick={() => updateStatus(complaint.id, 'processing')}
                                                className="flex-1 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center space-x-2"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                                <span className="hidden lg:inline">Proses</span>
                                            </button>
                                            <button
                                                onClick={() => updateStatus(complaint.id, 'resolved')}
                                                className="flex-1 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center space-x-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="hidden lg:inline">Selesai</span>
                                            </button>
                                            <button
                                                onClick={() => deleteComplaint(complaint.id)}
                                                className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all group"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                            <Megaphone className="w-10 h-10 text-slate-200" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Belum Ada Aduan</h3>
                            <p className="text-slate-400 mt-2 font-medium max-w-xs mx-auto">Semua laporan aduan dari user akan muncul di sini untuk dikelola.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
                        <NextImage
                            src={selectedImage}
                            alt="Full Preview"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
