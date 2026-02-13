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
        <section className="relative w-full bg-white border-b border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="relative aspect-[21/9] md:aspect-[3/1] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <Image
                        src={banners[0].image_url}
                        alt="Banner"
                        fill
                        className="absolute inset-0 w-full h-full object-cover"
                        unoptimized
                    />
                </div>
            </div>
        </section>
    )
}
