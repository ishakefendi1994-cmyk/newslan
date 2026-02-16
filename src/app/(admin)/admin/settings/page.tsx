'use client'

import { useState, useEffect } from 'react'
import {
    Save,
    Globe,
    Palette,
    User,
    Code,
    Loader2,
    Check,
    AlertCircle,
    Image as ImageIcon,
    Upload,
    ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

export default function AdminSettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Form States
    const [settings, setSettings] = useState({
        site_name: '',
        site_description: '',
        site_logo: '',
        site_favicon: '',
        site_author_avatar: '',
        header_scripts: '',
        footer_scripts: ''
    })

    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 'main')
                .single()

            if (data) {
                setSettings({
                    site_name: data.site_name || '',
                    site_description: data.site_description || '',
                    site_logo: data.site_logo || '',
                    site_favicon: data.site_favicon || '',
                    site_author_avatar: data.site_author_avatar || '',
                    header_scripts: data.header_scripts || '',
                    footer_scripts: data.footer_scripts || ''
                })
            }
        } catch (error: any) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(prev => ({ ...prev, [field]: true }))
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file)
            setSettings(prev => ({ ...prev, [field]: publicUrl }))
        } catch (error: any) {
            setStatus({ type: 'error', message: `Gagal mengunggah ${field}: ` + error.message })
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }))
        }
    }

    async function handleSave() {
        try {
            setSaving(true)
            setStatus(null)

            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    id: 'main',
                    ...settings,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            setStatus({ type: 'success', message: 'Pengaturan berhasil disimpan!' })
            setTimeout(() => setStatus(null), 3000)
        } catch (error: any) {
            setStatus({ type: 'error', message: 'Gagal menyimpan pengaturan: ' + error.message })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium">Memuat pengaturan...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Konfigurasi global untuk branding dan fungsionalitas website Anda.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center space-x-3 shadow-sm border ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{status.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: General & Branding */}
                <div className="lg:col-span-2 space-y-8">
                    {/* General Settings */}
                    <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
                            <Globe className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-900">General Information</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Website Name</label>
                                <input
                                    type="text"
                                    value={settings.site_name}
                                    onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                                    placeholder="e.g., NEWSLAN.ID"
                                    className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 text-slate-900 font-medium outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Website Description (SEO)</label>
                                <textarea
                                    value={settings.site_description}
                                    onChange={(e) => setSettings(prev => ({ ...prev, site_description: e.target.value }))}
                                    rows={3}
                                    placeholder="Deskripsi singkat website untuk hasil pencarian Google..."
                                    className="w-full px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 text-slate-900 font-medium outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Code Injection */}
                    <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
                            <Code className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-900">Custom Code Injection</h3>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic bg-amber-50 p-3 rounded-lg border border-amber-100">
                            Hati-hati: Memasukkan script yang salah dapat merusak tampilan atau fungsionalitas website. Gunakan bagian ini untuk Google Tag Manager, Tracker, atau CSS kustom.
                        </p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Header Scripts (Inside &lt;head&gt;)</label>
                                <textarea
                                    value={settings.header_scripts}
                                    onChange={(e) => setSettings(prev => ({ ...prev, header_scripts: e.target.value }))}
                                    rows={6}
                                    placeholder="<!-- Tempel kode tracker atau CSS head di sini -->"
                                    className="w-full px-4 py-3 bg-slate-900 border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 text-indigo-100 font-mono text-xs outline-none transition-all resize-none leading-relaxed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Footer Scripts (Before &lt;/body&gt;)</label>
                                <textarea
                                    value={settings.footer_scripts}
                                    onChange={(e) => setSettings(prev => ({ ...prev, footer_scripts: e.target.value }))}
                                    rows={6}
                                    placeholder="<!-- Tempel script analytics atau kode footer di sini -->"
                                    className="w-full px-4 py-3 bg-slate-900 border-slate-800 rounded-xl focus:ring-1 focus:ring-indigo-500 text-indigo-100 font-mono text-xs outline-none transition-all resize-none leading-relaxed"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Imagery */}
                <div className="space-y-8">
                    {/* Branding Assets */}
                    <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
                            <Palette className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-900">Branding</h3>
                        </div>

                        {/* Logo */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Site Logo</label>
                            <div className="relative aspect-[3/1] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden group flex items-center justify-center">
                                {settings.site_logo ? (
                                    <>
                                        <img src={settings.site_logo} alt="Logo Preview" className="max-h-16 w-auto object-contain p-4" />
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <label className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-50 shadow-md">
                                                Change
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'site_logo')} />
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <label className="w-full h-full flex flex-col items-center justify-center space-y-1 cursor-pointer hover:bg-slate-100 transition-colors">
                                        <Upload className="w-5 h-5 text-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400">Upload Logo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'site_logo')} />
                                    </label>
                                )}
                                {uploading.site_logo && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Favicon */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Favicon (32x32)</label>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                                    {settings.site_favicon ? (
                                        <img src={settings.site_favicon} alt="Favicon" className="w-8 h-8 object-contain" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                                <label className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold text-center cursor-pointer hover:bg-slate-800 transition-all shadow-md">
                                    {uploading.site_favicon ? 'Uploading...' : 'Upload Favicon'}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'site_favicon')} />
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Author Profile */}
                    <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
                            <User className="w-5 h-5 text-slate-400" />
                            <h3 className="font-bold text-slate-900">Author Display</h3>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Author Avatar</label>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative w-24 h-24 rounded-full border-4 border-slate-50 shadow-inner overflow-hidden group">
                                    {settings.site_author_avatar ? (
                                        <img src={settings.site_author_avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                            <User className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <label className="p-1.5 bg-white rounded-full text-slate-900 cursor-pointer shadow-lg">
                                            <Upload className="w-4 h-4" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'site_author_avatar')} />
                                        </label>
                                    </div>
                                    {uploading.site_author_avatar && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-primary">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 text-center font-medium px-4">
                                    Avatar ini akan digunakan sebagai foto penulis global untuk berita.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Quick Links */}
                    <div className="bg-slate-900 p-8 rounded-2xl text-white space-y-4 shadow-xl shadow-slate-900/10">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight">External Tools</h3>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            Gunakan script injection untuk menghubungkan website dengan layanan pihak ketiga.
                        </p>
                        <ul className="text-xs text-slate-500 space-y-2 font-bold">
                            <li>• Google Search Console</li>
                            <li>• Google Analytics 4</li>
                            <li>• Facebook Pixel</li>
                            <li>• WhatsApp Chat Widget</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
