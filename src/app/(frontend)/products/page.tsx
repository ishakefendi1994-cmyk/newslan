'use client'

import { useState, useEffect, useMemo } from 'react'
import { ShoppingBag, ChevronRight, Loader2, Search, Filter, SlidersHorizontal, ArrowUpDown, Tag, Star, Package } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { ShopeeProductCard } from '@/components/commerce/ShopeeProductCard'

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStore, setSelectedStore] = useState('Semua')
    const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high'>('latest')
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

    // Get unique stores for filter
    const stores = useMemo(() => {
        const storeSet = new Set<string>()
        products.forEach(p => {
            p.affiliate_links?.forEach((l: any) => storeSet.add(l.store_name))
        })
        return ['Semua', ...Array.from(storeSet)]
    }, [products])

    // Filter and Sort Logic
    const filteredAndSortedProducts = useMemo(() => {
        let result = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStore = selectedStore === 'Semua' || p.affiliate_links?.some((l: any) => l.store_name === selectedStore)
            return matchesSearch && matchesStore
        })

        const extractPrice = (priceStr: string) => {
            // Match the first sequence of numbers (handling dots/commas if needed, but here we just strip non-digits)
            // If it's a range like "Rp 100.000 - 200.000", we want the 100000
            const match = priceStr.match(/\d+(\.\d+)?/g)
            if (!match) return 0
            // Join and re-strip to handle thousands separators if they were matched as separate parts
            // But usually just taking the first group of digits before any non-digit separator is safer for range start
            const firstPart = priceStr.split('-')[0].replace(/[^0-9]/g, '')
            return parseInt(firstPart) || 0
        }

        if (sortBy === 'price-low') {
            result.sort((a, b) => extractPrice(a.price_range) - extractPrice(b.price_range))
        } else if (sortBy === 'price-high') {
            result.sort((a, b) => extractPrice(b.price_range) - extractPrice(a.price_range))
        }

        return result
    }, [products, searchTerm, selectedStore, sortBy])

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-20">
            {/* Header Banner */}
            <div className="bg-[#990000] text-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 py-10 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="text-center md:text-left space-y-4">
                        <div className="inline-flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                            <Tag className="w-4 h-4 text-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Newslan Prime Choice</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                            Shopee <span className="text-yellow-400">Deals</span> <br />
                            Collection
                        </h1>
                        <p className="text-white/70 font-medium max-w-md text-sm md:text-base">
                            Produk terbaik pilihan redaksi dengan penawaran harga paling kompetitif dari marketplace terpercaya.
                        </p>
                    </div>
                    <div className="hidden md:block relative w-64 h-64">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse" />
                        <Package className="w-full h-full text-white/10 rotate-12" />
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 -skew-x-12 translate-x-1/4" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Desktop Sidebar Filter */}
                    <div className="hidden lg:block w-64 shrink-0 space-y-8">
                        <div>
                            <h3 className="flex items-center text-sm font-black uppercase tracking-widest mb-6">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter Produk
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Marketplace</p>
                                    <div className="space-y-2">
                                        {stores.map(store => (
                                            <button
                                                key={store}
                                                onClick={() => setSelectedStore(store)}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${selectedStore === store
                                                    ? 'bg-[#990000] text-white border-[#990000] shadow-lg shadow-[#990000]/20'
                                                    : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
                                                    }`}
                                            >
                                                {store}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-gray-900 to-black rounded-3xl text-white">
                                    <Star className="w-8 h-8 text-yellow-400 mb-4" />
                                    <h4 className="font-black text-sm uppercase italic tracking-tighter">Newslan Verified</h4>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Semua produk telah melewati kurasi editorial kami.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Areas */}
                    <div className="flex-1 space-y-6">

                        {/* Mobile Category Chips (Horizontal Scroll) */}
                        <div className="lg:hidden flex overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 gap-2">
                            {stores.map(store => (
                                <button
                                    key={store}
                                    onClick={() => setSelectedStore(store)}
                                    className={`whitespace-nowrap px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedStore === store
                                        ? 'bg-[#990000] text-white shadow-lg shadow-[#990000]/20'
                                        : 'bg-white text-gray-500 border border-gray-100'
                                        }`}
                                >
                                    {store}
                                </button>
                            ))}
                        </div>

                        {/* Control Bar (Search & Sort) */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari produk impian Anda..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 focus:ring-0 text-sm transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2 hidden md:block">Urutkan:</div>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="flex-1 md:flex-none bg-gray-50 border-none text-xs font-bold rounded-xl py-2.5 px-4 focus:ring-0"
                                >
                                    <option value="latest">Terbaru</option>
                                    <option value="price-low">Harga Terendah</option>
                                    <option value="price-high">Harga Tertinggi</option>
                                </select>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {loading ? (
                            <div className="py-20 text-center text-gray-400">
                                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#990000]" />
                                <p className="text-xs font-black uppercase tracking-widest">Memuat Produk Terbaik...</p>
                            </div>
                        ) : filteredAndSortedProducts.length === 0 ? (
                            <div className="py-32 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                                <ShoppingBag className="w-16 h-16 mx-auto mb-6 opacity-10" />
                                <p className="text-sm font-black uppercase tracking-widest text-gray-400">Produk tidak ditemukan</p>
                                <button onClick={() => { setSearchTerm(''); setSelectedStore('Semua'); }} className="mt-4 text-[#990000] text-[10px] font-bold uppercase tracking-widest hover:underline">Reset Filter</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
                                {filteredAndSortedProducts.map((product) => (
                                    <ShopeeProductCard
                                        key={product.id}
                                        id={product.id}
                                        name={product.name}
                                        image={product.image_url}
                                        priceRange={product.price_range}
                                        storeNames={product.affiliate_links?.map((l: any) => l.store_name)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-6 py-20 text-center opacity-30">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Curated with high Standards</p>
                <h3 className="text-2xl font-black mt-2 italic tracking-tighter">NEWLAN COMMERCE NETWORK © 2026</h3>
            </div>
        </div>
    )
}
