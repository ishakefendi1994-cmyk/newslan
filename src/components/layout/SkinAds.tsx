'use client'

import Image from 'next/image'

interface SkinAdsProps {
    skinAds: { left: any, right: any }
}

export default function SkinAds({ skinAds = { left: null, right: null } }: SkinAdsProps) {
    const ads = skinAds

    if (!ads.left && !ads.right) return null

    // Base styles for skin ads
    // We use 1100px as the layout width to calculate the available side space accurately
    const skinStyles = "hidden xl:block fixed top-0 h-screen z-0 w-[calc((100vw-1100px)/2)] transition-opacity duration-500"

    return (
        <>
            {/* Left Skin */}
            {ads.left && (
                <div className={`${skinStyles} left-0 flex justify-end`}>
                    <a
                        href={ads.left.link_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full max-w-[250px] h-full relative"
                    >
                        {ads.left.type === 'image' && ads.left.image_url ? (
                            <div className="absolute inset-0 w-full h-full">
                                <Image
                                    src={ads.left.image_url}
                                    alt={ads.left.title || 'Advertisement'}
                                    fill
                                    className="object-cover object-center"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: ads.left.html_content || '' }} />
                        )}
                    </a>
                </div>
            )}

            {/* Right Skin */}
            {ads.right && (
                <div className={`${skinStyles} right-0 flex justify-start`}>
                    <a
                        href={ads.right.link_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full max-w-[250px] h-full relative"
                    >
                        {ads.right.type === 'image' && ads.right.image_url ? (
                            <div className="absolute inset-0 w-full h-full">
                                <Image
                                    src={ads.right.image_url}
                                    alt={ads.right.title || 'Advertisement'}
                                    fill
                                    className="object-cover object-center"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: ads.right.html_content || '' }} />
                        )}
                    </a>
                </div>
            )}
        </>
    )
}
