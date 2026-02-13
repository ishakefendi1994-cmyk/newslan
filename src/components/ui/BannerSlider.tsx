'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function BannerSlider({ banners }: any) {
    if (!banners || banners.length === 0) return (
        <div className="bg-red-50 p-4 text-red-500 text-center font-bold">
            DEBUG: No banners found ({banners?.length})
        </div>
    )

    return (
        <section className="relative w-full bg-white py-6">
            <div className="w-full px-4 sm:px-6">
                <div className="relative aspect-[21/9] md:aspect-[3/1] w-full rounded-[2rem] overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Image
                        src={banners[0].image_url}
                        alt="Banner"
                        fill
                        className="absolute inset-0 w-full h-full object-cover"
                        unoptimized
                    />
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
                        DEBUG: {banners.length} banners | {banners[0].title}
                    </div>
                </div>
            </div>
        </section>
    )
}
