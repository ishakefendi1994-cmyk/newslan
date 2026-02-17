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
    return (
        <Link href={`/products/${id}`} className="group bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col h-full">
            {/* Image Container */}
            <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-contain group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        unoptimized
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-gray-200" />
                    </div>
                )}

                {/* Sale Badge (Optional Decoration) */}
                <div className="absolute top-2 left-0 bg-[#990000] text-white text-[10px] font-black px-2 py-0.5 rounded-r-sm shadow-sm uppercase italic">
                    Hot Deal
                </div>
            </div>

            {/* Content Container */}
            <div className="p-3 flex flex-col flex-1 justify-between">
                <div>
                    {/* Title (2 lines max) */}
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-2 group-hover:text-[#990000] transition-colors h-[2.5rem]">
                        {name}
                    </h3>

                    {/* Price - Highlighted */}
                    <div className="text-[#990000] font-black text-lg tracking-tighter mb-2">
                        {formatRupiah(priceRange)}
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-bold text-gray-500">4.9 | Terjual 100+</span>
                    </div>
                    {storeNames.length > 0 && (
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter bg-gray-100 px-1.5 py-0.5 rounded">
                            {storeNames[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Action Strip */}
            <div className="bg-[#990000] text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Detail Produk</span>
            </div>
        </Link>
    )
}
