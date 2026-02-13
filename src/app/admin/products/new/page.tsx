'use client'

import { useState } from 'react'
import { Save, ChevronLeft, Plus, Trash2, ShoppingBag, Loader2, Check, AlertCircle, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

export default function NewProductPage() {
    const router = useRouter()
    const supabase = createClient()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [priceRange, setPriceRange] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [links, setLinks] = useState([{ store_name: 'Shopee', url: '' }])

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

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

    async function handleSubmit() {
        if (!name || links.some(l => !l.store_name || !l.url)) {
            setStatus({ type: 'error', message: 'Name and all links are required.' })
            return
        }

        try {
            setLoading(true)
            setStatus(null)

            // 1. Create Product
            const { data: product, error: pError } = await supabase
                .from('products')
                .insert({ name, description, image_url: imageUrl, price_range: priceRange })
                .select()
                .single()

            if (pError) throw pError

            // 2. Create Affiliate Links
            const { error: lError } = await supabase
                .from('affiliate_links')
                .insert(links.map(l => ({ ...l, product_id: product.id })))

            if (lError) throw lError

            setStatus({ type: 'success', message: 'Product created successfully!' })
            setTimeout(() => router.push('/admin/products'), 2000)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error saving product' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/products" className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">New Product</h1>
                        <p className="text-gray-500 text-sm">Add a product to your affiliate network.</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading || uploading}
                    className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{loading ? 'Saving...' : 'Save Product'}</span>
                </button>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{status.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Product Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., iPhone 15 Pro Max"
                                className="w-full text-xl font-black border-none focus:ring-0 placeholder:text-gray-200 p-0"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Price Range</label>
                            <input
                                type="text"
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value)}
                                placeholder="e.g., Rp 15.000.000 - 20.000.000"
                                className="w-full text-lg border-none focus:ring-0 placeholder:text-gray-200 p-0"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Details about this product..."
                                className="w-full text-sm border-none focus:ring-0 placeholder:text-gray-200 p-0 resize-none leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Product Image</label>
                        {imageUrl ? (
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-gray-100 group">
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <label className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-100">
                                        Change Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="w-full py-20 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-all text-gray-400 cursor-pointer">
                                {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                                <span className="text-xs font-bold">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold">Affiliate Links</h3>
                            <button onClick={addLink} className="p-2 bg-gray-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {links.map((link, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-gray-200 transition-all space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <input
                                            type="text"
                                            value={link.store_name}
                                            onChange={(e) => updateLink(idx, 'store_name', e.target.value)}
                                            placeholder="Store Name (e.g. Shopee)"
                                            className="bg-transparent border-none p-0 text-xs font-black uppercase tracking-widest text-gray-600 focus:ring-0 placeholder:text-gray-300 w-full"
                                        />
                                        <button onClick={() => removeLink(idx)} className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => updateLink(idx, 'url', e.target.value)}
                                        placeholder="Affiliate URL"
                                        className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs w-full focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-3xl text-white space-y-4 shadow-xl shadow-black/20">
                        <ShoppingBag className="w-10 h-10 text-primary" />
                        <h3 className="text-xl font-black tracking-tighter">Affiliate Tip</h3>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            Pastikan format link sesuai (URL lengkap dengan https://) agar tracking klik berfungsi dengan benar di halaman artikel.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
