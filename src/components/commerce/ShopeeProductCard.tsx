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
        if (s.includes('whatsapp')) return 'bg-emerald-50 text-emerald-600 border-emerald-100'
        if (s.includes('tiktok')) return 'bg-gray-900 text-white border-gray-900'
        if (s.includes('shopee')) return 'bg-orange-50 text-orange-600 border-orange-100'
        if (s.includes('tokopedia')) return 'bg-green-50 text-green-600 border-green-100'
        return 'bg-gray-50 text-gray-500 border-gray-100'
    }

    return (
        <Link href={`/products/${id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-gray-100 flex flex-col h-full">
            {/* Image Container with refined proportions */}
            <div className="relative aspect-[4/5] w-full bg-gray-50 overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-1000"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-gray-200" />
                    </div>
                )}

                {/* Refined Sale Badge */}
                <div className="absolute top-3 left-3 bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg border border-white/20 uppercase tracking-widest italic z-10">
                    Hot Deal
                </div>
            </div>

            {/* Content Container */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                    {/* Marketplace Tag - Positioned at top of content for better visibility */}
                    {storeNames.length > 0 && (
                        <div className={`inline-block text-[8px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-md mb-3 ${getStoreStyle(storeNames[0])}`}>
                            {storeNames[0]}
                        </div>
                    )}

                    {/* Title (Clean Typography) */}
                    <h3 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                        {name}
                    </h3>

                    {/* Price - Elegant & Bold */}
                    <div className="text-primary font-black text-base tracking-tighter mb-4">
                        {formatRupiah(priceRange)}
                    </div>
                </div>

                {/* Footer Meta (Trust & Progress) */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 gray-400">
                        <div className="flex -space-x-1">
                            {[1, 2, 3].map(i => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight">4.9 | 100+ Terjual</span>
                    </div>
                </div>
            </div>

            {/* Discrete Modern Detail Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
        </Link>
    )
}
