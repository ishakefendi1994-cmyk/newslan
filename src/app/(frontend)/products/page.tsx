'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, ChevronRight, Loader2, ExternalLink, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, affiliate_links(*)')
                    .order('created_at', { ascending: false })

                if (error) throw error
                setProducts(data || [])
            } catch (err) {
                console.error('Error fetching products:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    const getStoreColor = (store: string) => {
        const s = store.toLowerCase()
        if (s.includes('shopee')) return 'bg-[#EE4D2D] hover:bg-[#d73211]'
        if (s.includes('tiktok')) return 'bg-black hover:bg-gray-800'
        if (s.includes('tokopedia')) return 'bg-[#03AC0E] hover:bg-[#028b0b]'
        if (s.includes('lazada')) return 'bg-[#101452] hover:bg-[#0a0d35]'
        return 'bg-primary hover:bg-secondary'
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <div className="bg-white px-6 py-12 border-b border-gray-100">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic">Hot Products</h1>
                <p className="text-gray-500 text-sm mt-2">Rekomendasi produk terbaik pilihan redaksi Newslan.id</p>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="py-20 text-center text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Memuat Produk...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 bg-white rounded-[2rem] border border-dashed border-gray-200">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-6 opacity-10" />
                        <p className="text-sm font-black uppercase tracking-widest">Belum ada produk rekomendasi</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-xl transition-all duration-500">
                                {/* Image Wrapper */}
                                <Link href={`/products/${product.id}`} className="relative w-full md:w-32 aspect-square rounded-[1.5rem] bg-gray-50 overflow-hidden shrink-0 border border-gray-50 block">
                                    {product.image_url ? (
                                        <Image
                                            src={product.image_url}
                                            alt={product.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ShoppingBag className="w-10 h-10 text-gray-200" />
                                        </div>
                                    )}
                                </Link>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <Link href={`/products/${product.id}`} className="block group/title">
                                                <h3 className="font-extrabold text-lg md:text-xl tracking-tight leading-tight group-hover/title:text-primary transition-colors">
                                                    {product.name}
                                                </h3>
                                            </Link>
                                            <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                                                {product.description || 'Pilihan produk terbaik untuk aktivitas harian Anda.'}
                                            </p>
                                        </div>
                                        <div className="text-left md:text-right shrink-0">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimasi Harga:</p>
                                            <span className="text-xl font-black text-black tracking-tighter">
                                                {formatRupiah(product.price_range)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Links */}
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        <Link
                                            href={`/products/${product.id}`}
                                            className="bg-black text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all shadow-lg hover:shadow-none hover:translate-y-0.5"
                                        >
                                            <span>Lihat Detail</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>

                                        {/* Quick Links (Hidden on small mobile if too many) */}
                                        <div className="hidden sm:flex flex-wrap gap-2">
                                            {product.affiliate_links && product.affiliate_links.slice(0, 2).map((link: any) => (
                                                <div
                                                    key={link.id}
                                                    className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-1"
                                                >
                                                    <ShoppingCart className="w-3 h-3" />
                                                    <span>{link.store_name} Available</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-6 py-12 text-center opacity-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Curated by Editorial</p>
                <h3 className="text-lg font-black mt-2 italic">DAILY DEALS ONLY AT NEWSLAN.ID</h3>
            </div>
        </div>
    )
}
