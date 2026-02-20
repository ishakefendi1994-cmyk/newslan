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
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 sm:gap-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group">
            {/* Native Badge */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-gray-50 rounded-bl-xl border-l border-b border-gray-100 flex items-center space-x-1.5 z-10">
                <Tag className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">Sponsored</span>
            </div>

            {/* Image Section */}
            <div className="relative w-full sm:w-32 md:w-40 aspect-square rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 group-hover:scale-[1.02] transition-transform duration-500">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 128px, 160px"
                />
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="space-y-1.5 md:space-y-2">
                    <h4 className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {name}
                    </h4>

                    <div
                        className="prose prose-sm prose-slate max-w-none line-clamp-2 md:line-clamp-3 text-gray-500 leading-relaxed text-[13px] md:text-sm"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />

                    <div className="flex items-center space-x-2">
                        <span className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter">
                            {formatRupiah(priceRange)}
                        </span>
                    </div>
                </div>

                <div className="mt-4 md:mt-5 flex flex-wrap gap-2 md:gap-3">
                    {links.map((link) => (
                        <a
                            key={link.store}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackClick(link.store)}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-all duration-300 shadow-lg shadow-gray-900/10 hover:shadow-primary/20 group/btn"
                        >
                            <span>Lihat di {link.store}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    )
}
