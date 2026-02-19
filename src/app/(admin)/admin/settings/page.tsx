'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Palette, Globe, Info, Check, Layout, ChevronDown, Image as ImageIcon, Upload, X, Sparkles } from 'lucide-react'
import { uploadImage } from '@/lib/storage'

export default function SettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [settings, setSettings] = useState({
        site_name: '',
        theme_color: '#990000',
        site_description: '',
        default_homepage: '/',
        logo_type: 'text',
        site_logo_url: '',
        default_ai_language: 'id',
        groq_api_key: '',
        replicate_api_token: '',
        contact_whatsapp: '',
        contact_email: '',
        site_favicon_url: '',
        site_url: ''
    })
    const [categories, setCategories] = useState<any[]>([])

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            setLoading(true)
            const [settingsRes, categoriesRes] = await Promise.all([
                supabase.from('site_settings').select('*'),
                supabase.from('categories').select('id, name, slug').order('name')
            ])

            if (settingsRes.error) throw settingsRes.error
            if (categoriesRes.error) throw categoriesRes.error

            setCategories(categoriesRes.data || [])

            const s = { ...settings }
            settingsRes.data?.forEach(item => {
                if (item.setting_key === 'site_name') s.site_name = item.setting_value
                if (item.setting_key === 'theme_color') s.theme_color = item.setting_value
                if (item.setting_key === 'site_description') s.site_description = item.setting_value
                if (item.setting_key === 'default_homepage') s.default_homepage = item.setting_value
                if (item.setting_key === 'logo_type') s.logo_type = item.setting_value
                if (item.setting_key === 'site_logo_url') s.site_logo_url = item.setting_value
                if (item.setting_key === 'default_ai_language') s.default_ai_language = item.setting_value
                if (item.setting_key === 'groq_api_key') s.groq_api_key = item.setting_value
                if (item.setting_key === 'replicate_api_token') s.replicate_api_token = item.setting_value
                if (item.setting_key === 'contact_whatsapp') s.contact_whatsapp = item.setting_value
                if (item.setting_key === 'contact_email') s.contact_email = item.setting_value
                if (item.setting_key === 'site_favicon_url') s.site_favicon_url = item.setting_value
                if (item.setting_key === 'site_url') s.site_url = item.setting_value
            })
            setSettings(s)
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        try {
            setSaving(true)
            setMessage(null)

            // Re-checking schema from full_schema_migration.sql: setting_value text NOT NULL
            const finalUpdates = [
                { setting_key: 'site_name', setting_value: settings.site_name },
                { setting_key: 'theme_color', setting_value: settings.theme_color },
                { setting_key: 'site_description', setting_value: settings.site_description },
                { setting_key: 'default_homepage', setting_value: settings.default_homepage },
                { setting_key: 'logo_type', setting_value: settings.logo_type },
                { setting_key: 'site_logo_url', setting_value: settings.site_logo_url },
                { setting_key: 'default_ai_language', setting_value: settings.default_ai_language },
                { setting_key: 'groq_api_key', setting_value: settings.groq_api_key },
                { setting_key: 'replicate_api_token', setting_value: settings.replicate_api_token },
                { setting_key: 'contact_whatsapp', setting_value: settings.contact_whatsapp },
                { setting_key: 'contact_email', setting_value: settings.contact_email },
                { setting_key: 'site_favicon_url', setting_value: settings.site_favicon_url },
                { setting_key: 'site_url', setting_value: settings.site_url }
            ]

            for (const update of finalUpdates) {
                const { error } = await supabase
                    .from('site_settings')
                    .upsert(update, { onConflict: 'setting_key' })

                if (error) throw error
            }

            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan! Refresh halaman untuk melihat perubahan.' })
        } catch (error: any) {
            console.error('Error saving settings:', error)
            setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message })
        } finally {
            setSaving(false)
        }
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file)
            setSettings({ ...settings, site_logo_url: publicUrl })
            setMessage({ type: 'success', text: 'Logo berhasil diunggah!' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Gagal mengunggah logo' })
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-slate-500">Memuat pengaturan...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Website</h1>
                <p className="text-slate-500 text-sm mt-1">Sesuaikan identitas dan tampilan website Anda.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    <Check className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    {/* General Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <Globe className="w-5 h-5 text-indigo-500" />
                            <span>Identitas Website</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Website</label>
                                <input
                                    type="text"
                                    value={settings.site_name}
                                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
                                    placeholder="Masukkan nama website..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi / Slogan</label>
                                <textarea
                                    value={settings.site_description}
                                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm min-h-[100px]"
                                    placeholder="Masukkan deskripsi website untuk SEO..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL Website (Canonical URL)</label>
                                <input
                                    type="text"
                                    value={settings.site_url}
                                    onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm font-mono"
                                    placeholder="https://newslan.id"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 italic">Penting untuk SEO, Sitemap, dan Robots.txt agar link berarah ke domain yang benar.</p>
                            </div>
                        </div>
                    </div>

                    {/* Logo Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <Info className="w-5 h-5 text-blue-500" />
                            <span>Pengaturan Logo</span>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe Logo</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSettings({ ...settings, logo_type: 'text' })}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.logo_type === 'text' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'}`}
                                    >
                                        <span className="font-black italic text-lg uppercase tracking-tighter">ABC</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Logo Teks</span>
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, logo_type: 'image' })}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${settings.logo_type === 'image' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'}`}
                                    >
                                        <Globe className="w-6 h-6" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Logo Gambar</span>
                                    </button>
                                </div>
                            </div>

                            {settings.logo_type === 'image' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">File Logo</label>

                                    {settings.site_logo_url ? (
                                        <div className="relative aspect-video max-w-[240px] rounded-2xl overflow-hidden border border-slate-100 group bg-slate-50">
                                            <img src={settings.site_logo_url} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                <label className="bg-white text-black p-2 rounded-xl cursor-pointer hover:bg-gray-100 shadow-sm">
                                                    <Upload className="w-4 h-4" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                                                </label>
                                                <button
                                                    onClick={() => setSettings({ ...settings, site_logo_url: '' })}
                                                    className="bg-white text-rose-600 p-2 rounded-xl hover:bg-rose-50 shadow-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full max-w-[240px] aspect-video rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50 transition-all text-slate-400 cursor-pointer">
                                            {uploading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <ImageIcon className="w-8 h-8" />}
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{uploading ? 'Mengunggah...' : 'Pilih File Logo'}</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                                        </label>
                                    )}

                                    <p className="text-[10px] text-slate-400 italic">Logo akan disimpan ke Cloudinary secara otomatis.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Favicon Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <ImageIcon className="w-5 h-5 text-indigo-500" />
                            <span>Pengaturan Favicon</span>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] text-slate-500 italic">Favicon adalah ikon kecil yang muncul di tab browser. Gunakan gambar persegi (1:1) untuk hasil terbaik.</p>

                            {settings.site_favicon_url ? (
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-100 group bg-slate-50">
                                    <img src={settings.site_favicon_url} alt="Favicon Preview" className="w-full h-full object-contain p-2" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1">
                                        <label className="bg-white text-black p-1.5 rounded-lg cursor-pointer hover:bg-gray-100 shadow-sm">
                                            <Upload className="w-3 h-3" />
                                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                                if (!e.target.files || e.target.files.length === 0) return
                                                try {
                                                    setUploading(true)
                                                    const url = await uploadImage(e.target.files[0])
                                                    setSettings({ ...settings, site_favicon_url: url })
                                                    setMessage({ type: 'success', text: 'Favicon berhasil diunggah!' })
                                                } catch (err: any) {
                                                    setMessage({ type: 'error', text: err.message })
                                                } finally {
                                                    setUploading(false)
                                                }
                                            }} disabled={uploading} />
                                        </label>
                                        <button
                                            onClick={() => setSettings({ ...settings, site_favicon_url: '' })}
                                            className="bg-white text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 shadow-sm"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-all">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        if (!e.target.files || e.target.files.length === 0) return
                                        try {
                                            setUploading(true)
                                            const url = await uploadImage(e.target.files[0])
                                            setSettings({ ...settings, site_favicon_url: url })
                                            setMessage({ type: 'success', text: 'Favicon berhasil diunggah!' })
                                        } catch (err: any) {
                                            setMessage({ type: 'error', text: err.message })
                                        } finally {
                                            setUploading(false)
                                        }
                                    }} disabled={uploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* AI Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <span>Pengaturan AI Autowriter</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bahasa Default AI</label>
                                <select
                                    value={settings.default_ai_language}
                                    onChange={(e) => setSettings({ ...settings, default_ai_language: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm appearance-none cursor-pointer"
                                >
                                    <option value="id">🇮🇩 Bahasa Indonesia</option>
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1 italic">Tentukan bahasa utama yang digunakan AI saat menulis atau menerjemahkan artikel secara otomatis.</p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        Groq API Key
                                        {settings.groq_api_key ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Configured</span> : <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Using ENV</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={settings.groq_api_key}
                                        onChange={(e) => setSettings({ ...settings, groq_api_key: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
                                        placeholder="gsk_..."
                                    />
                                    <p className="text-[10px] text-slate-400 italic">Dibutuhkan untuk penulisan dan penulisan ulang artikel.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        Replicate API Token
                                        {settings.replicate_api_token ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Configured</span> : <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Using ENV</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={settings.replicate_api_token}
                                        onChange={(e) => setSettings({ ...settings, replicate_api_token: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
                                        placeholder="r8_..."
                                    />
                                    <p className="text-[10px] text-slate-400 italic">Dibutuhkan untuk membuat gambar artikel otomatis.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Footer Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <Info className="w-5 h-5 text-emerald-500" />
                            <span>Kontak & Informasi Footer</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Utama</label>
                                <input
                                    type="text"
                                    value={settings.contact_whatsapp}
                                    onChange={(e) => setSettings({ ...settings, contact_whatsapp: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
                                    placeholder="+62 823..."
                                />
                                <p className="text-[10px] text-slate-400 italic">Muncul di bagian footer website.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Utama</label>
                                <input
                                    type="email"
                                    value={settings.contact_email}
                                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm"
                                    placeholder="redaksi@..."
                                />
                                <p className="text-[10px] text-slate-400 italic">Muncul di bagian footer website.</p>
                            </div>
                        </div>
                    </div>

                    {/* Appearance Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <Palette className="w-5 h-5 text-amber-500" />
                            <span>Tampilan & Tema</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warna Utama (Primary Color)</label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="color"
                                        value={settings.theme_color}
                                        onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
                                    />
                                    <input
                                        type="text"
                                        value={settings.theme_color}
                                        onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm font-mono"
                                        placeholder="#000000"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 italic">Warna ini akan digunakan pada tombol, link, dan elemen branding lainnya.</p>
                            </div>
                        </div>
                    </div>

                    {/* Page Navigation Settings */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <Layout className="w-5 h-5 text-emerald-500" />
                            <span>Navigasi & Halaman Utama</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Halaman Utama (Homepage)</label>
                                <div className="relative">
                                    <select
                                        value={settings.default_homepage}
                                        onChange={(e) => setSettings({ ...settings, default_homepage: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm appearance-none cursor-pointer"
                                    >
                                        <optgroup label="Halaman Standar">
                                            <option value="/">Beranda Standar</option>
                                            <option value="/news">Berita Terbaru</option>
                                            <option value="/shorts">Video Shorts</option>
                                        </optgroup>
                                        <optgroup label="Kategori Berita">
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={`/category/${cat.slug}`}>
                                                    Kategori: {cat.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 italic">Pilih halaman mana yang ingin dijadikan sebagai tampilan awal saat pengunjung membuka website Anda.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
                        <div className="flex items-center space-x-2 text-slate-900 font-bold">
                            <Info className="w-5 h-5 text-blue-500" />
                            <span>Informasi</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Perubahan pada pengaturan ini akan berdampak pada seluruh halaman website (Frontend).
                            Pastikan warna yang dipilih memiliki kontras yang cukup agar tulisan tetap terbaca.
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Simpan Perubahan</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
