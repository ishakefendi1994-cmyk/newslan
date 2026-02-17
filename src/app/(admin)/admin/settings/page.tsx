'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutGrid, Save, CheckCircle2, AlertCircle, Home, ShoppingBag, Clapperboard } from 'lucide-react'
import { revalidateSettings } from '@/app/actions'

const HOME_OPTIONS = [
    { label: 'Halaman Berita (Home)', value: '/', icon: Home },
    { label: 'Halaman Katalog Produk', value: '/products', icon: ShoppingBag },
    { label: 'Halaman Video', value: '/shorts', icon: Clapperboard },
]

export default function SettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [defaultHome, setDefaultHome] = useState('/')

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('setting_value')
                .eq('setting_key', 'default_homepage')
                .single()

            if (data) {
                setDefaultHome(data.setting_value)
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setMessage(null)

        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    setting_key: 'default_homepage',
                    setting_value: defaultHome,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'setting_key' })

            if (error) throw error

            // Revalidate cache on server
            await revalidateSettings()

            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })

            // Revalidate via tag if needed (optional since we'll use server component logic later)
            setTimeout(() => setMessage(null), 3000)
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Gagal menyimpan pengaturan' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#990000]"></div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">
                        Pengaturan Situs
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Atur konfigurasi landing page dan fitur utama situs.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#990000] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-900/10"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Simpan Perubahan
                </button>
            </div>

            {message && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-red-50 border-red-100 text-red-700'
                    } animate-in slide-in-from-top-2`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-sm uppercase tracking-tight">{message.text}</span>
                </div>
            )}

            {/* Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {HOME_OPTIONS.map((option) => {
                    const isActive = defaultHome === option.value
                    return (
                        <button
                            key={option.value}
                            onClick={() => setDefaultHome(option.value)}
                            className={`relative group p-6 rounded-3xl border-2 transition-all duration-300 text-left overflow-hidden ${isActive
                                ? 'border-[#990000] bg-red-50/30'
                                : 'border-gray-100 bg-white hover:border-gray-200'
                                }`}
                        >
                            <div className={`p-4 rounded-2xl mb-4 transition-colors ${isActive ? 'bg-[#990000] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                }`}>
                                <option.icon className="w-6 h-6" />
                            </div>
                            <h3 className={`font-black uppercase tracking-tighter leading-tight ${isActive ? 'text-[#990000]' : 'text-gray-900'
                                }`}>
                                {option.label}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 leading-relaxed">
                                {isActive ? 'Halaman Utama Saat Ini' : 'Pilih sebagai Landing Page'}
                            </p>

                            {isActive && (
                                <div className="absolute top-4 right-4 animate-in zoom-in-50">
                                    <CheckCircle2 className="w-5 h-5 text-[#990000] fill-red-50" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Info Card */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <LayoutGrid className="w-24 h-24" />
                </div>
                <div className="relative z-10 space-y-4">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-[#990000]">
                        Informasi Penting
                    </h4>
                    <p className="text-sm text-gray-300 font-medium leading-relaxed max-w-2xl">
                        Landing Page adalah halaman kartu nama utama situs Anda. Ketika pengunjung membuka domain utama tanpa path tambahan, mereka akan otomatis diarahkan ke halaman yang Anda pilih di atas.
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Database Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
