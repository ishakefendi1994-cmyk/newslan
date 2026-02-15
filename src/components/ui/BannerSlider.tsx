'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function BannerSlider({ banners }: any) {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (!banners || banners.length <= 1) return

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, 5000) // Slide every 5 seconds

        return () => clearInterval(timer)
    }, [banners])

    if (!banners || banners.length === 0) return (
        <div className="bg-red-50 p-4 text-red-500 text-center font-bold">
            DEBUG: No banners found ({banners?.length})
        </div>
    )

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
    }

    return (
        <section className="relative w-full bg-white border-b border-black group">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="relative aspect-[3/2] md:aspect-[2/1] w-full overflow-hidden bg-gray-100 shadow-lg border border-black/5">
                    {/* Slides */}
                    {banners.map((banner: any, index: number) => (
                        <div
                            key={banner.id || index}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            <Image
                                src={banner.image_url}
                                alt={`Banner ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                                sizes="(max-width: 1280px) 100vw, 1280px"
                            />
                        </div>
                    ))}

                    {/* Navigation Arrows */}
                    {banners.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-primary text-white p-2 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-primary text-white p-2 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Indicators (Dots) */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                            {banners.map((_: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-2 h-2 transition-all duration-300 ${index === currentIndex ? 'bg-primary w-8' : 'bg-white/50 hover:bg-white'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
