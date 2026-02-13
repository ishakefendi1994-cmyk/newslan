'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, Search, ExternalLink, Trash2, Edit2, Loader2, Check, AlertCircle } from 'lucide-react'
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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Products & Affiliate</h1>
                    <p className="text-gray-500 text-sm">Manage your inventory and tracking links.</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Product</span>
                </Link>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Products</p>
                    <p className="text-3xl font-black mt-2">{products.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Clicks</p>
                    <p className="text-3xl font-black mt-2">
                        {products.reduce((acc, p) => acc + (p.affiliate_links?.reduce((sum: number, l: any) => sum + l.click_count, 0) || 0), 0)}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Avg. CTR</p>
                    <p className="text-3xl font-black mt-2">12.4%</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-gray-100 focus:ring-0 text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Product</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Affiliate Links</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Clicks</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        <span className="text-sm font-bold">Loading products...</span>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <span className="text-sm font-bold">No products found.</span>
                                    </td>
                                </tr>
                            ) : filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <ShoppingBag className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black tracking-tight">{p.name}</p>
                                                <p className="text-xs text-gray-500 font-medium">{p.price_range || 'Contact for price'}</p>
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
                                                    className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-tighter text-gray-600 hover:bg-black hover:text-white transition-all flex items-center space-x-1"
                                                >
                                                    <span>{link.store_name}</span>
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-bold">
                                                {p.affiliate_links?.reduce((sum: number, l: any) => sum + l.click_count, 0) || 0}
                                            </span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: '45%' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-black">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-red-50 rounded-xl transition-all text-gray-400 hover:text-red-500">
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
