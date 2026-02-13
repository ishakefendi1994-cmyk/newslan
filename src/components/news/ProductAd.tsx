'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Loader2, ChevronRight } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

interface ProductAdProps {
    adId: string
}

export default function ProductAd({ adId }: ProductAdProps) {
    const supabase = createClient()
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (adId) fetchProducts()
    }, [adId])

    async function fetchProducts() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('ad_products')
                .select('product_id, products(*, affiliate_links(*))')
                .eq('ad_id', adId)
                .order('display_order')

            if (error) throw error
            setProducts(data?.map(item => item.products) || [])
        } catch (error) {
            console.error('Error fetching ad products:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="py-20 text-center text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Memuat Produk...</p>
            </div>
        )
    }

    if (products.length === 0) return null

    return (
        <div className="w-full my-12 space-y-6">
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
                                    <h3 className="font-extrabold text-lg md:text-xl tracking-tight leading-tight group-hover/title:text-primary transition-colors text-black">
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

                            {/* Quick Links */}
                            <div className="hidden sm:flex flex-wrap gap-2 text-gray-400">
                                {product.affiliate_links && product.affiliate_links.slice(0, 1).map((link: any) => (
                                    <div
                                        key={link.id}
                                        className="bg-gray-100 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-1"
                                    >
                                        <ShoppingBag className="w-3 h-3" />
                                        <span>{link.store_name} Available</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
