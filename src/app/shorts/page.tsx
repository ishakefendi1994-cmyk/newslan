'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Play, Clock, Share2, Loader2, PlayCircle, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function VideoGalleryPage() {
    const supabase = createClient()
    const [shorts, setShorts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedVideo, setSelectedVideo] = useState<any>(null)

    useEffect(() => {
        fetchShorts()
    }, [])

    async function fetchShorts() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('shorts')
                .select('*, short_products(products(*))')
                .order('created_at', { ascending: false })

            if (error) throw error
            setShorts(data || [])
        } catch (error) {
            console.error('Error fetching shorts:', error)
        } finally {
            setLoading(false)
        }
    }

    const getYouTubeID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-black uppercase tracking-widest italic">Loading Video Gallery...</p>
            </div>
        )
    }

    const featuredVideo = shorts[0]
    const otherVideos = shorts.slice(1)

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Brand */}
            <div className="bg-black text-white px-6 py-12 md:py-20 text-center">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">Newslan <span className="text-primary">TV</span></h1>
                <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto font-medium">
                    Tonton berita investigasi, edukasi, dan informasi terpercaya dalam format video eksklusif dari redaksi Newslan.id.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-10 md:-mt-16">
                {/* Featured Video Card */}
                {featuredVideo && (
                    <div
                        className="bg-white overflow-hidden shadow-2xl border border-gray-100 mb-12 group cursor-pointer"
                        onClick={() => setSelectedVideo(featuredVideo)}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="relative aspect-video lg:aspect-auto h-full overflow-hidden">
                                <Image
                                    src={featuredVideo.thumbnail_url || `https://img.youtube.com/vi/${getYouTubeID(featuredVideo.video_url)}/hqdefault.jpg`}
                                    alt={featuredVideo.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                        <Play className="w-8 h-8 fill-current ml-1" />
                                    </div>
                                </div>
                                <div className="absolute top-6 left-6 px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                    Featured Now
                                </div>
                            </div>
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                                <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight mb-4 group-hover:text-primary transition-colors">
                                    {featuredVideo.title}
                                </h2>
                                <div className="flex items-center space-x-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-6">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1.5" />
                                        <span>Just Published</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PlayCircle className="w-4 h-4 mr-1.5" />
                                        <span>HD Quality</span>
                                    </div>
                                </div>

                                {featuredVideo.short_products?.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tagged Products:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {featuredVideo.short_products.map((sp: any, i: number) => (
                                                <Link
                                                    key={i}
                                                    href={`/products/${sp.products.id}`}
                                                    className="inline-flex items-center space-x-2 bg-gray-50 hover:bg-black hover:text-white px-4 py-2 rounded-xl transition-all border border-gray-200"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ShoppingBag className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase">{sp.products.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {otherVideos.map((video) => (
                        <div
                            key={video.id}
                            className="bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group cursor-pointer"
                            onClick={() => setSelectedVideo(video)}
                        >
                            <div className="relative aspect-video overflow-hidden">
                                <Image
                                    src={video.thumbnail_url || `https://img.youtube.com/vi/${getYouTubeID(video.video_url)}/mqdefault.jpg`}
                                    alt={video.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                        <Play className="w-5 h-5 fill-current ml-0.5" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="font-black text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-4 italic uppercase">
                                    {video.title}
                                </h3>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        <span>Video</span>
                                    </div>
                                    {video.short_products?.length > 0 && (
                                        <div className="flex -space-x-2">
                                            {video.short_products.slice(0, 3).map((sp: any, i: number) => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden relative">
                                                    <Image src={sp.products.image_url} alt="P" fill className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {shorts.length === 0 && (
                    <div className="py-32 text-center">
                        <PlayCircle className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                        <h2 className="text-2xl font-black uppercase text-gray-300 italic">No videos yet</h2>
                    </div>
                )}
            </div>

            {/* Video Player Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl pointer-events-auto"
                        onClick={() => setSelectedVideo(null)}
                    />

                    <div className="relative w-full max-w-5xl aspect-video bg-black overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] pointer-events-auto ring-1 ring-white/10">
                        <button
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-all z-20"
                            onClick={() => setSelectedVideo(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeID(selectedVideo.video_url)}?autoplay=1&modestbranding=1&rel=0`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
