'use client'

import { useState, useEffect, useMemo } from 'react'
import { ShoppingBag, ChevronRight, Loader2, Search, Filter, SlidersHorizontal, ArrowUpDown, Tag, Star, Package, ShoppingCart, Bell, Mail, Smartphone, Laptop, Tv, Shirt, UtensilsCrossed, HeartPulse, Sparkles, Zap, Flame, Briefcase, Cpu, Plane, MoreHorizontal, HelpCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { ShopeeProductCard } from '@/components/commerce/ShopeeProductCard'

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStore, setSelectedStore] = useState('Semua')
    const [selectedCategory, setSelectedCategory] = useState('Semua')
    const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high'>('latest')
    const [productCategories, setProductCategories] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    supabase.from('products').select('*, affiliate_links(*)').order('created_at', { ascending: false }),
                    supabase.from('product_categories').select('*').order('name', { ascending: true })
                ])

                if (pRes.error) throw pRes.error
                if (cRes.error) throw cRes.error

                setProducts(pRes.data || [])
                setProductCategories(cRes.data || [])
            } catch (err) {
                console.error('Error fetching data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [])

    const stores = useMemo(() => {
        const storeSet = new Set<string>()
        products.forEach(p => {
            p.affiliate_links?.forEach((l: any) => storeSet.add(l.store_name))
        })
        return ['Semua', ...Array.from(storeSet)]
    }, [products])

    const filteredAndSortedProducts = useMemo(() => {
        let result = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStore = selectedStore === 'Semua' || p.affiliate_links?.some((l: any) => l.store_name === selectedStore)
            const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory
            return matchesSearch && matchesStore && matchesCategory
        })

        const extractPrice = (priceStr: string) => {
            const firstPart = priceStr.split('-')[0].replace(/[^0-9]/g, '')
            return parseInt(firstPart) || 0
        }

        if (sortBy === 'price-low') {
            result.sort((a, b) => extractPrice(a.price_range) - extractPrice(b.price_range))
        } else if (sortBy === 'price-high') {
            result.sort((a, b) => extractPrice(b.price_range) - extractPrice(a.price_range))
        }

        return result
    }, [products, searchTerm, selectedStore, selectedCategory, sortBy])

    const DynamicIcon = ({ name, className }: { name: string, className?: string }) => {
        const IconComponent = (LucideIcons as any)[name] || HelpCircle
        return <IconComponent className={className} />
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-20">
            {/* Top Marketplace Navigation Bar (Sticky Mockup) */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 lg:gap-8">
                        {/* Search Bar (Tokopedia Style) */}
                        <div className="flex-1 flex items-center relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#03AC0E]" />
                            </div>
                            <input
                                type="text"
                                placeholder={`Cari di Newslan Commerce...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-20 py-2.5 rounded-lg border border-gray-200 focus:border-[#03AC0E] focus:ring-1 focus:ring-[#03AC0E]/20 text-sm transition-all outline-none"
                            />
                            <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#03AC0E] text-white px-5 py-1.5 rounded-md text-xs font-black uppercase tracking-widest hover:bg-[#028b0b] transition-colors">
                                Cari
                            </button>
                        </div>

                        {/* Icons */}
                        <div className="hidden md:flex items-center gap-5 text-gray-400">
                            <Mail className="w-6 h-6 hover:text-gray-600 cursor-pointer transition-colors" />
                            <Bell className="w-6 h-6 hover:text-gray-600 cursor-pointer transition-colors" />
                            <ShoppingCart className="w-6 h-6 hover:text-gray-600 cursor-pointer transition-colors" />
                        </div>

                        <div className="h-8 w-[1px] bg-gray-100 hidden md:block" />

                        <div className="hidden md:flex items-center gap-3">
                            <button className="px-5 py-2 text-xs font-black text-[#03AC0E] border border-[#03AC0E] rounded-lg hover:bg-[#03AC0E]/5 transition-colors">Masuk</button>
                            <button className="px-5 py-2 text-xs font-black bg-[#03AC0E] text-white border border-[#03AC0E] rounded-lg hover:bg-[#028b0b] transition-colors shadow-md shadow-[#03AC0E]/10">Daftar</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Hero Banner (Marketplace Promo) */}
                <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-gradient-to-r from-emerald-600 to-teal-500 rounded-[1.5rem] overflow-hidden shadow-xl mb-8 group">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-between px-8 md:px-16 text-white z-10">
                        <div className="max-w-lg space-y-4">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Ramadan Ekstra Seru</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-[0.9]">
                                Gadget Andalan <br /> <span className="text-yellow-300">Diskon s.d 80%</span>
                            </h2>
                            <p className="text-xs md:text-sm font-bold text-white/80 uppercase tracking-[0.2em]">Verified Seller Only • Limited Time</p>
                            <button className="bg-white text-emerald-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-300 hover:text-emerald-900 transition-all shadow-lg">Cek Sekarang</button>
                        </div>
                        <div className="hidden lg:block relative w-96 h-96 opacity-40 translate-x-12 translate-y-12 rotate-12">
                            <ShoppingCart className="w-full h-full text-white" />
                        </div>
                    </div>
                </div>

                {/* Category Icon Shortcuts */}
                <div className="mb-12">
                    <h3 className="text-lg font-black italic tracking-tighter uppercase mb-6 flex items-center gap-3">
                        <div className="w-1 h-6 bg-[#03AC0E] rounded-full" />
                        Kategori Populer
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-6 px-1">
                        {productCategories.map((cat, idx) => (
                            <div
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'Semua' : cat.name)}
                                className="flex flex-col items-center gap-3 group cursor-pointer"
                            >
                                <div className={`w-14 h-14 md:w-16 md:h-16 ${cat.color} rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all ${selectedCategory === cat.name ? 'ring-2 ring-[#03AC0E] ring-offset-2 scale-105' : ''}`}>
                                    <DynamicIcon name={cat.icon} className="w-6 h-6" />
                                </div>
                                <span className={`text-[10px] font-bold text-center uppercase tracking-tight transition-colors ${selectedCategory === cat.name ? 'text-[#03AC0E]' : 'text-gray-500 group-hover:text-black'}`}>{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Section with Filters & Grid */}
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Desktop Filter Sidebar */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 sticky top-28 shadow-sm">
                            <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[#03AC0E]" />
                                Filter Produk
                            </h3>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Urutkan Berdasarkan</p>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => setSortBy('latest')} className={`text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'latest' ? 'bg-[#03AC0E]/10 text-[#03AC0E]' : 'text-gray-500 hover:bg-gray-50'}`}>Terbaru</button>
                                        <button onClick={() => setSortBy('price-low')} className={`text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'price-low' ? 'bg-[#03AC0E]/10 text-[#03AC0E]' : 'text-gray-500 hover:bg-gray-50'}`}>Harga Terendah</button>
                                        <button onClick={() => setSortBy('price-high')} className={`text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'price-high' ? 'bg-[#03AC0E]/10 text-[#03AC0E]' : 'text-gray-500 hover:bg-gray-50'}`}>Harga Tertinggi</button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Marketplace</p>
                                    <div className="flex flex-col gap-2">
                                        {stores.map(store => (
                                            <button
                                                key={store}
                                                onClick={() => setSelectedStore(store)}
                                                className={`text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedStore === store ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                {store}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Verified Ads</span>
                                    </div>
                                    <p className="text-[10px] text-emerald-600 font-medium">Temukan penawaran terbaik dari toko terverifikasi kami.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid Area */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6 border-b-2 border-transparent">
                                <button onClick={() => { setSelectedCategory('Semua'); setSelectedStore('Semua'); }} className={`pb-3 border-b-2 text-sm font-black uppercase italic tracking-tighter transition-all ${selectedCategory === 'Semua' && selectedStore === 'Semua' ? 'border-[#03AC0E] text-[#03AC0E]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>For You</button>
                                <button className="pb-3 text-gray-400 text-sm font-black uppercase italic tracking-tighter hover:text-gray-700">Official Store</button>
                                <button className="pb-3 text-gray-400 text-sm font-black uppercase italic tracking-tighter hover:text-gray-700">Terbaru</button>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Flame className="w-4 h-4 text-red-500" />
                                {filteredAndSortedProducts.length} Produk ditemukan
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center text-gray-400">
                                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#03AC0E]" />
                                <p className="text-xs font-black uppercase tracking-widest">Menyiapkan Rekomendasi Marketplace...</p>
                            </div>
                        ) : filteredAndSortedProducts.length === 0 ? (
                            <div className="py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                                <ShoppingBag className="w-16 h-16 mx-auto mb-6 opacity-20 text-[#03AC0E]" />
                                <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Produk Tidak Ditemukan</h3>
                                <p className="text-xs text-gray-500 mb-6">Coba gunakan kata kunci lain atau reset filter Anda.</p>
                                <button onClick={() => { setSearchTerm(''); setSelectedStore('Semua'); setSelectedCategory('Semua'); }} className="bg-[#03AC0E] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#03AC0E]/20">Reset Semua Filter</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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

            <div className="px-6 py-24 text-center">
                <div className="max-w-xs mx-auto h-[1px] bg-gray-200 mb-8" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.6em]">Premium Shopping Network</p>
                <h3 className="text-3xl font-black mt-2 italic tracking-tighter text-gray-200 uppercase">NEWLAN COMMERCE</h3>
            </div>
        </div>
    )
}
