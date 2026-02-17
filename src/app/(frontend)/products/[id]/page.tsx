'use client'

import { useState, useEffect, use } from 'react'
import { ShoppingBag, ChevronLeft, Loader2, ExternalLink, ShieldCheck, Truck, ArrowLeft, Tag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [product, setProduct] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*, affiliate_links(*)')
                    .eq('id', id)
                    .single()

                if (error) throw error
                setProduct(data)
            } catch (err) {
                console.error('Error fetching product:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    const getStoreColor = (store: string) => {
        const s = store.toLowerCase()
        if (s.includes('shopee')) return 'bg-[#EE4D2D] hover:bg-[#d73211]'
        if (s.includes('tiktok')) return 'bg-black hover:bg-gray-800'
        if (s.includes('tokopedia')) return 'bg-[#03AC0E] hover:bg-[#028b0b]'
        if (s.includes('lazada')) return 'bg-[#101452] hover:bg-[#0a0d35]'
        if (s.includes('whatsapp')) return 'bg-[#25D366] hover:bg-[#128C7E]'
        return 'bg-[#990000] hover:bg-black'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Memuat Detail Produk...</p>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <ShoppingBag className="w-20 h-20 text-gray-100 mb-6" />
                <h1 className="text-2xl font-black italic uppercase italic tracking-tighter">Produk Tidak Ditemukan</h1>
                <p className="text-gray-500 mt-2 mb-8">Maaf, produk yang Anda cari mungkin sudah tidak tersedia.</p>
                <Link href="/products" className="bg-black text-white px-8 py-3 rounded-none font-bold uppercase text-xs tracking-widest">
                    Kembali ke Katalog
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header / Navigation */}
            <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/products" className="flex items-center space-x-2 text-gray-500 hover:text-black transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Katalog Produk</span>
                    </Link>
                    <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-[#990000]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#990000]">Newslan Choice</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left: Product Image */}
                    <div className="lg:col-span-6">
                        <div className="relative aspect-square w-full rounded-[3rem] bg-white overflow-hidden shadow-2xl border border-gray-100 group">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                    unoptimized
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <ShoppingBag className="w-24 h-24 text-gray-200" />
                                </div>
                            )}

                            {/* Zoom Badge */}
                            <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-black">Ultra HD View</span>
                            </div>
                        </div>

                        {/* Extra Info Cards */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Garansi</p>
                                    <p className="text-sm font-bold">100% Original</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <Truck className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pengiriman</p>
                                    <p className="text-sm font-bold">Seluruh Indonesia</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Content */}
                    <div className="lg:col-span-6 space-y-10">
                        <div className="space-y-4">
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight italic uppercase italic transition-colors">
                                {product.name}
                            </h1>
                            <div className="flex items-center space-x-4">
                                <div className="bg-[#990000]/10 text-[#990000] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#990000]/20">
                                    Official Selection
                                </div>
                                <div className="h-4 w-[1px] bg-gray-200" />
                                <div className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                    SKU: NL-{product.id.substring(0, 6)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimasi Harga Terbaik:</p>
                            <div className="text-3xl font-black text-black tracking-tighter">
                                {formatRupiah(product.price_range)}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="h-4 w-1 bg-[#990000] rounded-full" />
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Deskripsi Produk</h3>
                            </div>
                            <div
                                className="prose prose-slate max-w-none prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-black prose-li:text-gray-700"
                                dangerouslySetInnerHTML={{
                                    __html: product.description || 'Produk pilihan redaksi Newslan.id yang telah dikurasi untuk memberikan pengalaman terbaik bagi Anda.'
                                }}
                            />
                        </div>

                        {/* Purchase Options */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest">Pilih Tempat Belanja</h3>
                                <span className="text-[10px] font-bold text-gray-400 italic">*Anda akan diarahkan ke Marketplace pilihan</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {product.affiliate_links && product.affiliate_links.length > 0 ? (
                                    product.affiliate_links.map((link: any) => (
                                        <Link
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            className={`${getStoreColor(link.store_name)} text-white py-4 px-6 rounded-2xl flex items-center justify-between group transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                                                    <ShoppingBag className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 leading-none mb-1">Beli di Marketplace</p>
                                                    <p className="text-lg font-black tracking-tight leading-none">{link.store_name} Official</p>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                                <ExternalLink className="w-4 h-4" />
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="bg-gray-100 p-8 rounded-[2rem] text-center border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Link Pembelian Belum Tersedia</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Note */}
                        <div className="p-6 bg-yellow-50 rounded-[2rem] border border-yellow-100/50">
                            <p className="text-[10px] font-bold text-yellow-800 leading-relaxed uppercase tracking-widest mb-1 italic">Disclaimer:</p>
                            <p className="text-[10px] text-yellow-700 leading-relaxed font-bold">
                                Harga dapat berubah sewaktu-waktu tergantung kebijakan Marketplace. Newslan.id mendapatkan komisi dari setiap pembelian yang Anda lakukan melalui link di atas tanpa biaya tambahan bagi Anda.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
