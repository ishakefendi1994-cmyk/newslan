'use client'

import { useState, useEffect } from 'react'
import { Save, ChevronLeft, Plus, Trash2, ShoppingBag, Loader2, Check, AlertCircle, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

export default function EditProductPage() {
    const router = useRouter()
    const { id } = useParams()
    const supabase = createClient()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [priceRange, setPriceRange] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [links, setLinks] = useState<any[]>([])
    const [category, setCategory] = useState('')
    const [productCategories, setProductCategories] = useState<any[]>([])

    useEffect(() => {
        fetchProductCategories()
    }, [])

    async function fetchProductCategories() {
        const { data } = await supabase.from('product_categories').select('*').order('name')
        if (data) setProductCategories(data)
    }

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        if (id) fetchProduct()
    }, [id])

    async function fetchProduct() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('products')
                .select('*, affiliate_links(*)')
                .eq('id', id)
                .single()

            if (error) throw error

            setName(data.name)
            setDescription(data.description || '')
            setPriceRange(data.price_range || '')
            setImageUrl(data.image_url || '')
            setLinks(data.affiliate_links || [])
            setCategory(data.category || '')
        } catch (error: any) {
            setStatus({ type: 'error', message: 'Gagal mengambil data produk: ' + error.message })
        } finally {
            setLoading(false)
        }
    }

    const addLink = () => {
        setLinks([...links, { store_name: '', url: '' }])
    }

    const removeLink = (index: number) => {
        setLinks(links.filter((_, i) => i !== index))
    }

    const updateLink = (index: number, field: string, value: string) => {
        const newLinks = [...links]
        newLinks[index] = { ...newLinks[index], [field]: value }
        setLinks(newLinks)
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file)
            setImageUrl(publicUrl)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error uploading image' })
        } finally {
            setUploading(false)
        }
    }

    async function handleUpdate() {
        if (!name || links.some(l => !l.store_name || !l.url)) {
            setStatus({ type: 'error', message: 'Nama dan semua link wajib diisi.' })
            return
        }

        try {
            setSaving(true)
            setStatus(null)

            // 1. Update Product
            const { error: pError } = await supabase
                .from('products')
                .update({ name, description, image_url: imageUrl, price_range: priceRange, category })
                .eq('id', id)

            if (pError) throw pError

            // 2. Sync Affiliate Links
            // Delete old ones
            const { error: dError } = await supabase
                .from('affiliate_links')
                .delete()
                .eq('product_id', id)

            if (dError) throw dError

            // Insert current ones (simplest sync strategy: delete and re-insert)
            const { error: lError } = await supabase
                .from('affiliate_links')
                .insert(links.map(l => ({
                    store_name: l.store_name,
                    url: l.url,
                    product_id: id,
                    click_count: l.click_count || 0
                })))

            if (lError) throw lError

            setStatus({ type: 'success', message: 'Produk berhasil diperbarui!' })
            setTimeout(() => router.push('/admin/products'), 1500)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Gagal menyimpan perubahan' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium">Memuat data produk...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/products" className="p-2 hover:bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Produk</h1>
                        <p className="text-slate-500 text-sm mt-1">Perbarui detail produk dan link afiliasi.</p>
                    </div>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={saving || uploading}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Nama Produk</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: iPhone 15 Pro Max"
                                className="w-full text-xl font-bold border-none focus:ring-0 placeholder:text-slate-200 p-0 text-slate-900"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Rentang Harga</label>
                            <input
                                type="text"
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value)}
                                placeholder="Contoh: Rp 15.000.000 - 20.000.000"
                                className="w-full text-lg border-none focus:ring-0 placeholder:text-slate-200 p-0 text-slate-700 font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Kategori</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full text-sm font-bold border-none focus:ring-0 p-0 text-slate-700 bg-transparent cursor-pointer"
                            >
                                <option value="">Pilih Kategori</option>
                                {productCategories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Deskripsi</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                placeholder="Detail mengenai produk ini..."
                                className="w-full text-sm border-none focus:ring-0 placeholder:text-slate-200 p-0 resize-none leading-relaxed text-slate-600 font-medium"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Gambar Produk</label>
                        {imageUrl ? (
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-100 group">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <label className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors shadow-lg">
                                        Ganti Gambar
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="w-full py-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2 hover:bg-slate-50 transition-all text-slate-400 cursor-pointer group">
                                {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8 group-hover:scale-110 transition-transform" />}
                                <span className="text-xs font-bold">{uploading ? 'Mengunggah...' : 'Upload Gambar'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Link Afiliasi</h3>
                            <button onClick={addLink} className="p-2 bg-slate-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all border border-slate-100">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {links.map((link, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <input
                                            type="text"
                                            value={link.store_name}
                                            onChange={(e) => updateLink(idx, 'store_name', e.target.value)}
                                            placeholder="Nama Toko (misal: Shopee)"
                                            className="bg-transparent border-none p-0 text-xs font-bold uppercase tracking-widest text-slate-600 focus:ring-0 placeholder:text-slate-300 w-full"
                                        />
                                        <button onClick={() => removeLink(idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => updateLink(idx, 'url', e.target.value)}
                                        placeholder="URL Afiliasi"
                                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs w-full focus:ring-1 focus:ring-primary outline-none text-slate-600 font-medium"
                                    />
                                </div>
                            ))}
                            {links.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                                    <p className="text-xs font-medium text-slate-400">Belum ada link afiliasi.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-2xl text-white space-y-4 shadow-xl shadow-slate-900/10">
                        <ShoppingBag className="w-10 h-10 text-primary" />
                        <h3 className="text-xl font-bold tracking-tight">Tips Afiliasi</h3>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            Pastikan format link sesuai (URL lengkap dengan https://) agar pelacakan klik berfungsi dengan benar di halaman artikel.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
