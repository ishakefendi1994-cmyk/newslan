'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function SkinAds() {
    const [ads, setAds] = useState<{ left: any, right: any }>({ left: null, right: null })
    const supabase = createClient()

    useEffect(() => {
        const fetchSkinAds = async () => {
            const { data } = await supabase
                .from('advertisements')
                .select('*')
                .in('placement', ['skin_left', 'skin_right'])
                .eq('is_active', true)

            if (data) {
                setAds({
                    left: data.find(ad => ad.placement === 'skin_left') || null,
                    right: data.find(ad => ad.placement === 'skin_right') || null
                })
            }
        }
        fetchSkinAds()
    }, [])

    if (!ads.left && !ads.right) return null

    // Base styles for skin ads
    const skinStyles = "hidden xl:block fixed top-0 h-screen z-0 w-[calc((100vw-1280px)/2)] transition-opacity duration-500"

    return (
        <>
            {/* Left Skin */}
            {ads.left && (
                <div className={`${skinStyles} left-0`}>
                    <a
                        href={ads.left.link_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full relative"
                    >
                        {ads.left.type === 'image' && ads.left.image_url ? (
                            <div className="absolute right-0 top-0 h-full w-full max-w-[200px] xl:max-w-[300px] 2xl:max-w-[400px]">
                                <Image
                                    src={ads.left.image_url}
                                    alt={ads.left.title || 'Advertisement'}
                                    fill
                                    className="object-cover object-right-top"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: ads.left.html_content || '' }} />
                        )}
                    </a>
                </div>
            )}

            {/* Right Skin */}
            {ads.right && (
                <div className={`${skinStyles} right-0`}>
                    <a
                        href={ads.right.link_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full relative"
                    >
                        {ads.right.type === 'image' && ads.right.image_url ? (
                            <div className="absolute left-0 top-0 h-full w-full max-w-[200px] xl:max-w-[300px] 2xl:max-w-[400px]">
                                <Image
                                    src={ads.right.image_url}
                                    alt={ads.right.title || 'Advertisement'}
                                    fill
                                    className="object-cover object-left-top"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: ads.right.html_content || '' }} />
                        )}
                    </a>
                </div>
            )}
        </>
    )
}
