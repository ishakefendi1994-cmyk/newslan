'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Loader2, Check, AlertCircle, LayoutGrid, Palette, Info } from 'lucide-react'
import * as Icons from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ProductCategoriesManager() {
    const supabase = createClient()
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [icon, setIcon] = useState('Package')
    const [color, setColor] = useState('bg-slate-100 text-slate-600')

    const iconOptions = [
        'Smartphone', 'Laptop', 'Tv', 'Shirt', 'UtensilsCrossed', 'HeartPulse',
        'Sparkles', 'Package', 'Briefcase', 'Cpu', 'Plane', 'Tag', 'ShoppingBag',
        'Zap', 'Flame', 'Star', 'Gift', 'Book', 'Coffee', 'Car', 'Music', 'Watch',
        'Camera', 'Gamepad'
    ]

    const colorOptions = [
        { name: 'Emerald', value: 'bg-emerald-100 text-emerald-600' },
        { name: 'Blue', value: 'bg-blue-100 text-blue-600' },
        { name: 'Orange', value: 'bg-orange-100 text-orange-600' },
        { name: 'Pink', value: 'bg-pink-100 text-pink-600' },
        { name: 'Yellow', value: 'bg-yellow-100 text-yellow-600' },
        { name: 'Red', value: 'bg-red-100 text-red-600' },
        { name: 'Purple', value: 'bg-purple-100 text-purple-600' },
        { name: 'Slate', value: 'bg-slate-100 text-slate-600' },
        { name: 'Cyan', value: 'bg-cyan-100 text-cyan-600' },
        { name: 'Indigo', value: 'bg-indigo-100 text-indigo-600' },
    ]

    useEffect(() => {
        fetchCategories()
    }, [])

    async function fetchCategories() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('product_categories')
                .select('*')
                .order('name', { ascending: true })
            if (error) throw error
            setCategories(data || [])
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name) return

        try {
            setSaving(true)
            const slug = name.toLowerCase().replace(/ /g, '-')

            if (editingId) {
                const { error } = await supabase
                    .from('product_categories')
                    .update({ name, slug, icon, color, updated_at: new Date().toISOString() })
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('product_categories')
                    .insert({ name, slug, icon, color })
                if (error) throw error
            }

            setStatus({ type: 'success', message: `Kategori berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}!` })
            resetForm()
            fetchCategories()
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Yakin ingin menghapus kategori ini?')) return
        try {
            const { error } = await supabase.from('product_categories').delete().eq('id', id)
            if (error) throw error
            setCategories(categories.filter(c => c.id !== id))
            setStatus({ type: 'success', message: 'Kategori berhasil dihapus' })
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message })
        }
    }

    function resetForm() {
        setEditingId(null)
        setName('')
        setIcon('Package')
        setColor('bg-slate-100 text-slate-600')
    }

    function startEdit(cat: any) {
        setEditingId(cat.id)
        setName(cat.name)
        setIcon(cat.icon)
        setColor(cat.color)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
        const IconComponent = (Icons as any)[name] || Icons.HelpCircle
        return <IconComponent className={className} />
    }

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
                        <LayoutGrid className="w-8 h-8 text-primary" />
                        Manajemen Kategori Produk
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Kelola kategori marketplace agar katalog tetap rapi.</p>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm border animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    <div className="flex items-center gap-3">
                        {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold">{status.message}</span>
                    </div>
                    <button onClick={() => setStatus(null)}><X className="w-4 h-4 opacity-50" /></button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-24 space-y-6">
                        <h3 className="font-black italic uppercase tracking-tighter text-slate-400 text-xs mb-4">
                            {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nama Kategori</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Aksesoris HP"
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-between">
                                    Pilih Ikon
                                    <DynamicIcon name={icon} className="w-4 h-4 text-primary" />
                                </label>
                                <select
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none cursor-pointer"
                                >
                                    {iconOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center justify-between">
                                    Pilih Warna
                                    <div className={`w-4 h-4 rounded-full ${color.split(' ')[0]}`} />
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {colorOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setColor(opt.value)}
                                            className={`h-8 rounded-lg flex items-center justify-center transition-all ${opt.value} ${color === opt.value ? 'ring-2 ring-primary ring-offset-2' : 'opacity-40 hover:opacity-100'}`}
                                            title={opt.name}
                                        >
                                            {color === opt.value && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {editingId ? 'Update' : 'Simpan'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="bg-slate-100 text-slate-600 px-4 py-3 rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-3xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="group bg-white p-4 rounded-3xl border border-slate-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${cat.color}`}>
                                            <DynamicIcon name={cat.icon} className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black italic uppercase tracking-tighter text-slate-900">{cat.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cat.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(cat)}
                                            className="p-2 text-slate-400 hover:bg-slate-50 hover:text-primary rounded-lg transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="p-2 text-slate-400 hover:bg-slate-50 hover:text-rose-500 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && categories.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada kategori yang dibuat.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
