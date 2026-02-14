'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Megaphone, Loader2, Send, ImageIcon, X, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { uploadImage } from '@/lib/storage'

export default function ComplaintsPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            let imageUrl = null

            // 1. Upload Image to Cloudinary if exists
            if (imageFile) {
                setUploading(true)
                try {
                    imageUrl = await uploadImage(imageFile)
                } catch (uploadError: any) {
                    throw new Error('Gagal mengunggah foto ke Cloudinary: ' + uploadError.message)
                }
                setUploading(false)
            }

            // 2. Insert into complaints table
            const { error } = await supabase
                .from('complaints')
                .insert([
                    {
                        user_id: user.id,
                        title,
                        description,
                        image_url: imageUrl,
                        status: 'pending'
                    }
                ])

            if (error) throw error

            setMessage({ type: 'success', text: 'Aduan Anda berhasil dikirim! Tim kami akan meninjau secepatnya.' })
            setTitle('')
            setDescription('')
            setImageFile(null)
            setImagePreview(null)

        } catch (error: any) {
            console.error('Submit Error:', error)
            setMessage({ type: 'error', text: error.message || 'Gagal mengirim aduan' })
        } finally {
            setLoading(false)
            setUploading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-black text-white p-8 pt-12 rounded-b-[3rem] shadow-2xl relative">
                <Link href="/profile" className="absolute top-8 left-8 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight uppercase">Kirim Aduan</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Sampaikan keluhan atau laporan Anda</p>
                </div>
            </div>

            <div className="max-w-md mx-auto p-6 space-y-8 -mt-10">
                {/* Feedback Message */}
                {message && (
                    <div className={`p-4 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <p className="text-xs font-bold leading-snug">{message.text}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Judul Aduan</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all outline-none font-bold text-sm"
                            placeholder="Contoh: Masalah Pembayaran"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Deskripsi Lengkap</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all outline-none font-bold text-sm resize-none"
                            placeholder="Ceritakan detail masalah Anda..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Lampiran Foto (Opsional)</label>

                        {imagePreview ? (
                            <div className="relative group rounded-2xl overflow-hidden border border-gray-100">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-gray-400 mb-2" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Klik untuk unggah foto</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        <span>Kirim Aduan Sekarang</span>
                    </button>

                    {(loading || uploading) && (
                        <p className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                            {uploading ? 'Mengunggah foto...' : 'Sedang mengirim...'}
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}
