'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, User, Mail, Lock, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true)
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    router.push('/auth/login')
                    return
                }

                setEmail(user.email || '')

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()

                if (profile?.full_name) {
                    setFullName(profile.full_name)
                }
            } catch (error) {
                console.error('Error fetching settings:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [router, supabase])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Update Profile (Name)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id)

            if (profileError) throw profileError

            // 2. Update Email if changed
            if (email !== user.email) {
                const { error: authError } = await supabase.auth.updateUser({ email })
                if (authError) throw authError
                setMessage({ type: 'success', text: 'Profil diperbarui. Silakan cek email baru Anda untuk konfirmasi.' })
            } else {
                setMessage({ type: 'success', text: 'Nama berhasil diperbarui!' })
            }

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Gagal memperbarui profil' })
        } finally {
            setSaving(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password tidak cocok' })
            return
        }

        setSaving(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error

            setMessage({ type: 'success', text: 'Password berhasil diperbarui!' })
            setPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Gagal memperbarui password' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Memuat Pengaturan...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-black text-white p-8 pt-12 rounded-b-[3rem] shadow-2xl relative">
                <Link href="/profile" className="absolute top-8 left-8 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight uppercase">Pengaturan Akun</h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Kelola data diri & keamanan</p>
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

                {/* Profile Form */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-gray-50 rounded-xl">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Data Profil</h2>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nama Lengkap</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all outline-none font-bold text-sm"
                                    placeholder="Masukkan nama lengkap"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all outline-none font-bold text-sm"
                                    placeholder="nama@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-black text-white p-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Simpan Perubahan</span>
                        </button>
                    </form>
                </section>

                {/* Password Form */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-gray-50 rounded-xl">
                            <Lock className="w-5 h-5 text-gray-400" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Keamanan</h2>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all outline-none font-bold text-sm"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Konfirmasi Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all outline-none font-bold text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || !password}
                            className="w-full bg-primary text-white p-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center space-x-2 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            <span>Update Password</span>
                        </button>
                    </form>
                </section>
            </div>
        </div>
    )
}
