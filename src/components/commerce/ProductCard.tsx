'use client'

import Image from 'next/image'
import { ShoppingCart, ExternalLink, Tag } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

interface AffiliateLink {
    store: string
    url: string
}

interface ProductCardProps {
    name: string
    description: string
    image: string
    priceRange: string
    links: AffiliateLink[]
}

export function ProductCard({ name, description, image, priceRange, links }: ProductCardProps) {
    const trackClick = (store: string) => {
        // In a real app, send this to Supabase analytics
        console.log(`Tracking click for ${name} on ${store}`)
    }

    return (
        <div className="bg-white border-l-4 border-primary p-5 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="relative w-full md:w-1/3 aspect-square overflow-hidden bg-gray-50">
                <Image src={image} alt={name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-primary">
                        <Tag className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Recommended Product</span>
                    </div>
                    <h4 className="text-xl font-bold">{name}</h4>
                    <div
                        className="prose prose-sm prose-slate max-w-none prose-p:text-gray-500 prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                    <div className="text-lg font-black text-black">{formatRupiah(priceRange)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {links.map((link) => (
                        <a
                            key={link.store}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackClick(link.store)}
                            className="flex items-center justify-between px-4 py-2 rounded-lg border border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
                        >
                            <span className="text-xs font-bold font-sans">Beli di {link.store}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-black" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    )
}
