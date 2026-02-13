'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import ProductAd from './ProductAd'

interface AdRendererProps {
    ad: {
        id?: string
        type: 'image' | 'html' | 'product_list'
        image_url?: string
        link_url?: string
        html_content?: string
        title?: string
        width?: number | null
        height?: number | null
    } | null
    className?: string
    isSidebar?: boolean
}

export default function AdRenderer({ ad, className = "", isSidebar = false }: AdRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (ad?.type === 'html' && ad.html_content && containerRef.current) {
            // Select only scripts within this specific container
            const scripts = containerRef.current.getElementsByTagName('script')
            const scriptsArray = Array.from(scripts)

            scriptsArray.forEach((oldScript) => {
                const newScript = document.createElement('script')

                // Copy all attributes
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value)
                })

                if (oldScript.src) {
                    // Prevent duplicate scripts if they are already in the document (like adsbygoogle.js)
                    const existing = document.querySelector(`script[src="${oldScript.src}"]`)
                    if (existing) return
                    newScript.src = oldScript.src
                } else {
                    // Wrap execution in a try-catch for AdSense push errors 
                    // and handle potential multiple pushes
                    const content = oldScript.textContent || ''
                    if (content.includes('adsbygoogle')) {
                        newScript.textContent = `
                            try {
                                if (window.adsbygoogle) {
                                  (adsbygoogle = window.adsbygoogle || []).push({});
                                }
                            } catch (e) {
                                console.error("AdSense Push Error (Gracefully Handled):", e);
                            }
                        `
                    } else {
                        newScript.textContent = content
                    }
                }

                document.body.appendChild(newScript)
            })
        }
    }, [ad])

    if (!ad) return null

    // Determine dimensions
    const adWidth = ad.width || (isSidebar ? 400 : 1200)
    const adHeight = ad.height || (isSidebar ? 400 : 400)

    return (
        <div className={`w-full ${isSidebar ? 'm-0 p-0' : 'overflow-hidden'} not-prose ${className}`}>
            {ad.type === 'image' && ad.image_url ? (
                <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-opacity hover:opacity-90"
                >
                    {isSidebar ? (
                        <p className="m-0 p-0">
                            <img
                                src={ad.image_url}
                                alt={ad.title || ''}
                                width={ad.width || undefined}
                                height={ad.height || undefined}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </p>
                    ) : (
                        <div className="relative w-full aspect-video md:aspect-[3/1] bg-gray-50 border border-gray-100 shadow-sm overflow-hidden">
                            <Image
                                src={ad.image_url}
                                alt={ad.title || 'Advertisement'}
                                width={adWidth}
                                height={adHeight}
                                className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
                                unoptimized
                            />
                        </div>
                    )}
                </a>
            ) : ad.type === 'html' && ad.html_content ? (
                <div
                    ref={containerRef}
                    className="flex justify-center w-full"
                    dangerouslySetInnerHTML={{ __html: ad.html_content }}
                />
            ) : ad.type === 'product_list' && ad.id ? (
                <ProductAd adId={ad.id} />
            ) : null}
        </div>
    )
}
