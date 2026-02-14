'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, Search, ExternalLink, Trash2, Edit2, Loader2, Check, AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminProductsPage() {
    const supabase = createClient()
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('products')
                .select('*, affiliate_links(*)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProducts(data || [])
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string, name: string) {
        const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus produk "${name}"? Tindakan ini tidak dapat dibatalkan.`)
        if (!confirmed) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Refresh list
            setProducts(products.filter(p => p.id !== id))
        } catch (error: any) {
            console.error('Error deleting product:', error)
            alert('Gagal menghapus produk: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products & Affiliate</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola inventaris dan link pelacakan Anda.</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Product</span>
                </Link>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Products</p>
                    <p className="text-3xl font-bold mt-2 text-slate-900">{products.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Clicks</p>
                    <p className="text-3xl font-bold mt-2 text-slate-900">
                        {products.reduce((acc, p) => acc + (p.affiliate_links?.reduce((sum: number, l: any) => sum + l.click_count, 0) || 0), 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Conversion Rate</p>
                        <p className="text-3xl font-bold mt-2 text-slate-900">12.4%</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 focus:ring-0 text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Product</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Affiliate Links</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Clicks</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && products.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                                        <span className="text-sm font-medium">Loading products...</span>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <span className="text-sm font-medium">Belum ada produk ditemukan.</span>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <ShoppingBag className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 tracking-tight">{p.name}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">{p.price_range || 'Hubungi untuk harga'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {p.affiliate_links?.map((link: any) => (
                                                <a
                                                    key={link.id}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-tight text-slate-600 hover:bg-slate-900 hover:text-white transition-all flex items-center space-x-1"
                                                >
                                                    <span>{link.store_name}</span>
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-bold text-slate-900">
                                                {p.affiliate_links?.reduce((sum: number, l: any) => sum + l.click_count, 0) || 0}
                                            </span>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: '45%' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/admin/products/${p.id}`}
                                                className="p-2 hover:bg-white hover:border-slate-200 border border-transparent shadow-sm rounded-xl transition-all text-slate-500 hover:text-indigo-600"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(p.id, p.name)}
                                                disabled={loading}
                                                className="p-2 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all text-slate-400 hover:text-rose-600 disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
