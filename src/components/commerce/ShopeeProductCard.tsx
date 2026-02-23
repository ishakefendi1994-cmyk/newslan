'use client'

import Image from 'next/image'
import { ExternalLink, Tag, ShoppingCart, Star } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import Link from 'next/link'

interface AffiliateLink {
    id?: string
    store_name: string
    url: string
}

interface ShopeeProductCardProps {
    id: string
    name: string
    priceRange: string
    image: string
    storeNames?: string[]
}

export function ShopeeProductCard({ id, name, priceRange, image, storeNames = [] }: ShopeeProductCardProps) {
    const getStoreStyle = (store: string) => {
        const s = store.toLowerCase()
        if (s.includes('whatsapp')) return 'bg-[#e8faf1] text-[#00a884] border-[#d1f4e6]'
        if (s.includes('tiktok')) return 'bg-gray-900 text-white border-gray-900'
        if (s.includes('shopee')) return 'bg-[#fff5f1] text-[#ee4d2d] border-[#ffdbd0]'
        if (s.includes('tokopedia')) return 'bg-[#f0f9f1] text-[#03ac0e] border-[#d7f0d8]'
        return 'bg-gray-50 text-gray-500 border-gray-100'
    }

    return (
        <Link href={`/products/${id}`} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-gray-100 flex flex-col h-full">
            {/* Image Container with refined proportions */}
            <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000 p-2"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-gray-200" />
                    </div>
                )}

                {/* Refined Sale Badge (Blue style from image) */}
                <div className="absolute top-2 left-2 bg-[#0047ba] text-white text-[10px] font-black px-4 py-1.5 rounded-xl shadow-lg border border-white/20 uppercase tracking-tighter italic z-10">
                    HOT DEAL
                </div>
            </div>

            {/* Content Container */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex-1">
                    {/* Marketplace Tag (Pill style from image) */}
                    {storeNames.length > 0 && (
                        <div className={`inline-block text-[10px] font-black uppercase tracking-widest border px-4 py-1.5 rounded-xl mb-4 ${getStoreStyle(storeNames[0])}`}>
                            {storeNames[0]}
                        </div>
                    )}

                    {/* Title (Clean Typography) */}
                    <h3 className="text-[15px] font-bold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-[#0047ba] transition-colors">
                        {name}
                    </h3>

                    {/* Price - Bold Blue from image */}
                    <div className="text-[#0047ba] font-black text-xl tracking-tighter mb-4">
                        {formatRupiah(priceRange)}
                    </div>
                </div>

                {/* Footer Meta (Trust & Progress) */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-0.5">
                            {[1, 2, 3].map(i => <Star key={i} className="w-3.5 h-3.5 fill-[#ffb400] text-[#ffb400]" />)}
                        </div>
                        <span className="text-[10px] font-black text-[#8e99ad] uppercase tracking-tight">4.9 | 100+ TERJUAL</span>
                    </div>
                </div>
            </div>

            {/* Discrete Modern Detail Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0047ba] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </Link>
    )
}
