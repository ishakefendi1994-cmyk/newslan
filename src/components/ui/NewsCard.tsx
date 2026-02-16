'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar } from 'lucide-react'
import { optimizeCloudinaryUrl } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface NewsCardProps {
    title: string
    slug: string
    image: string
    category: string
    categoryColor?: string
    excerpt?: string
    isPremium?: boolean
    isDark?: boolean
    variant?: 'default' | 'large' | 'compact' | 'techcrunch-hero' | 'techcrunch-list' | 'in-brief' | 'grid-standard' | 'horizontal-medium' | 'recent-list' | 'spotlight' | 'feature-block' | 'overlay-grid'
    author?: string
    date?: string
}

export function NewsCard({
    title,
    slug,
    image,
    category,
    categoryColor,
    excerpt,
    isPremium,
    isDark,
    variant = 'default',
    author = 'Newslan Team',
    date = 'Just now'
}: NewsCardProps) {
    const textColor = isDark ? 'text-white' : 'text-black'
    const secondaryTextColor = isDark ? 'text-gray-300' : 'text-gray-500' // Use hard gray for consistency
    const borderColor = isDark ? 'border-white/10' : 'border-gray-100'
    const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
    const router = useRouter()

    const handlePrefetch = () => {
        router.prefetch(`/news/${slug}`)
    }

    // TechCrunch Hero: Large image with text overlay at bottom
    if (variant === 'techcrunch-hero') {
        return (
            <div className="group relative w-full h-[500px] md:h-[600px] overflow-hidden bg-black" onMouseEnter={handlePrefetch}>
                <Image
                    src={optimizeCloudinaryUrl(image)}
                    alt={title}
                    fill
                    className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                    sizes="100vw"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full max-w-4xl">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h2 className="text-3xl md:text-5xl font-bold text-white leading-[0.95] tracking-tighter hover:text-primary transition-colors mb-4">
                            {title}
                        </h2>
                    </Link>
                    <div className="flex items-center text-gray-300 text-sm font-bold">
                        <span>{author}</span>
                        <span className="mx-2">•</span>
                        <span>{date}</span>
                    </div>
                </div>
                {isPremium && (
                    <div className="absolute top-0 right-0 bg-[#ffd700] text-black text-xs font-bold px-3 py-1 uppercase tracking-widest">
                        Premium
                    </div>
                )}
            </div>
        )
    }

    // TechCrunch List: Content Left, Small Image Right
    if (variant === 'techcrunch-list') {
        return (
            <div className="group flex flex-row justify-between items-start gap-6 py-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors" onMouseEnter={handlePrefetch}>
                <div className="flex-1 flex flex-col space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className="text-lg md:text-xl font-bold leading-tight text-black group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                    </Link>
                    <div className="flex items-center text-gray-400 text-xs font-bold mt-1">
                        <span>{author}</span>
                        <span className="mx-2">•</span>
                        <span>{date}</span>
                    </div>
                </div>
                <div className="relative w-32 h-24 md:w-48 md:h-32 shrink-0 overflow-hidden bg-gray-100">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 128px, 192px"
                    />
                </div>
            </div>
        )
    }

    // In Brief: Tiny compact text only or with icon
    if (variant === 'in-brief') {
        return (
            <div className="group py-4 border-b border-gray-100 last:border-0" onMouseEnter={handlePrefetch}>
                <div className="flex items-start space-x-3">
                    <div className="shrink-0 mt-1">
                        {/* TechCrunch green double diamond icon simulation */}
                        <div className="w-4 h-4 bg-primary skew-x-[-10deg]" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">In Brief</span>
                        <Link href={`/news/${slug}`} className="block">
                            <h4 className="text-sm font-bold leading-tight text-black group-hover:text-primary transition-colors">
                                {title}
                            </h4>
                        </Link>
                        <div className="text-gray-400 text-[10px] font-bold mt-1">
                            <span>{author}</span>
                            <span className="mx-1">•</span>
                            <span>{date}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (variant === 'large') {
        return (
            <div className={`group flex flex-col md:flex-row gap-8 overflow-hidden h-auto ${isDark ? 'bg-transparent' : 'bg-white'}`} onMouseEnter={handlePrefetch}>
                {/* Large Image */}
                <div className="md:w-3/5 relative aspect-[2/1] h-[200px] md:h-auto overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 60vw"
                    />
                    {isPremium && (
                        <div className="absolute top-0 left-0 bg-yellow-400 text-black text-xs font-black px-3 py-1 uppercase tracking-widest">
                            Premium
                        </div>
                    )}
                </div>
                {/* Content */}
                <div className="md:w-2/5 flex flex-col justify-center py-2 pr-4 space-y-4">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/60' : 'text-primary'}`}>
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className={`text-xl md:text-2xl font-black leading-[1.1] tracking-tighter hover:text-primary transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                            {title}
                        </h3>
                    </Link>
                    {excerpt && <p className={`${secondaryTextColor} text-sm leading-relaxed line-clamp-3 font-medium`}>{excerpt}</p>}
                    <div className="pt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-[#990000]">
                        <span>Read Full Story</span>
                        <span className="ml-2 transition-transform group-hover:translate-x-1">&rarr;</span>
                    </div>
                </div>
            </div>
        )
    }

    if (variant === 'spotlight') {
        return (
            <div className="group flex flex-col space-y-4 pb-6 border-b border-gray-100 last:border-0" onMouseEnter={handlePrefetch}>
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 rounded-none border border-black/5">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute bottom-4 left-4">
                        <span className="bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#990000] border-l-4 border-[#990000] shadow-xl">
                            {category}
                        </span>
                    </div>
                </div>
                <div className="space-y-2">
// Variant: spotlight
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className="text-sm font-black leading-tight text-black group-hover:text-[#990000] transition-colors line-clamp-2 underline-offset-4 decoration-2 decoration-[#990000]/30 group-hover:underline">
                            {title}
                        </h3>
                    </Link>

// Variant: grid-standard
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className="text-xl font-black leading-[1.1] text-black group-hover:text-[#990000] transition-colors tracking-tighter decoration-4 decoration-[#990000]/10 group-hover:underline underline-offset-8 line-clamp-2">
                            {title}
                        </h3>
                    </Link>

// Default variant
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className={`text-lg font-bold leading-tight hover:text-primary transition-colors line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            {title}
                        </h3>
                    </Link>
                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        <span>{date}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (variant === 'grid-standard') {
        return (
            <div className="group flex flex-col space-y-6" onMouseEnter={handlePrefetch}>
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-none border border-black/10">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                    />
                    <div className="absolute bottom-4 left-4">
                        <span className="bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#990000] border-l-4 border-[#990000]">
                            {category}
                        </span>
                    </div>
                </div>
                <div className="space-y-3 px-2">
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className="text-xl font-black leading-[1.1] text-black group-hover:text-[#990000] transition-colors tracking-tighter decoration-4 decoration-[#990000]/10 group-hover:underline underline-offset-8 line-clamp-2">
                            {title}
                        </h3>
                    </Link>
                    <div className="flex items-center text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-t border-gray-100 pt-3">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-[#990000]/50" />
                        <span>{date}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (variant === 'horizontal-medium') {
        return (
            <div className="group flex flex-row items-start gap-5 py-6 border-b border-gray-100 last:border-0" onMouseEnter={handlePrefetch}>
                <div className="relative w-32 md:w-48 h-24 md:h-32 shrink-0 overflow-hidden border border-black/5">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 128px, 192px"
                    />
                </div>
                <div className="flex-1 space-y-2">
                    <Link href={`/news/${slug}`} className="block">
                        <h4 className="text-sm md:text-base font-black leading-tight text-black group-hover:text-[#990000] transition-colors line-clamp-2">
                            {title}
                        </h4>
                    </Link>
                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        <span>{date}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (variant === 'recent-list') {
        return (
            <div className="group flex flex-row items-center gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-xl" onMouseEnter={handlePrefetch}>
                <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-gray-50">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="80px"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <Link href={`/news/${slug}`} className="block">
                        <h4 className="text-xs font-black leading-snug text-gray-800 group-hover:text-[#990000] transition-colors line-clamp-2">
                            {title}
                        </h4>
                    </Link>
                </div>
            </div>
        )
    }

    if (variant === 'feature-block') {
        const isLightBg = categoryColor === 'white' || categoryColor === '#ffffff' || categoryColor === '#fff'
        const blockBgColor = isLightBg || !categoryColor ? '#990000' : categoryColor

        return (
            <div className={`group flex flex-col h-full rounded-none overflow-hidden shadow-sm hover:shadow-md transition-shadow`} onMouseEnter={handlePrefetch}>
                <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between" style={{ backgroundColor: blockBgColor }}>
                    <div className="space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                            {category}
                        </span>
                        <Link href={`/news/${slug}`} className="block">
                            <h3 className="text-xl md:text-2xl font-black leading-tight text-white tracking-tight group-hover:underline underline-offset-4 decoration-2">
                                {title}
                            </h3>
                        </Link>
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-white/60 uppercase tracking-widest mt-6">
                        <Calendar className="w-3 h-3 mr-1.5" />
                        <span>{date}</span>
                    </div>
                </div>
            </div>
        )
    }

    if (variant === 'overlay-grid') {
        return (
            <div className="group flex flex-col h-full space-y-3" onMouseEnter={handlePrefetch}>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none border border-black/5">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                </div>
                <div className="flex flex-col space-y-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-primary'}`}>
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h4 className={`text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-3 ${isDark ? 'text-white' : 'text-black'}`}>
                            {title}
                        </h4>
                    </Link>
                </div>
            </div>
        )
    }

    // Default Card (Vertical)
    return (
        <div className={`group flex flex-col space-y-4 pb-8 border-b border-gray-100 last:border-0 ${isDark ? 'bg-transparent border-white/10' : 'bg-white'}`} onMouseEnter={handlePrefetch}>
            <div className="relative aspect-[2/1] w-full overflow-hidden bg-gray-100">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
                />
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {category}
                </span>
                <Link href={`/news/${slug}`} className="block">
                    <h3 className={`text-lg font-bold leading-tight hover:text-primary transition-colors line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        {title}
                    </h3>
                </Link>
                {excerpt && <p className={`text-sm leading-relaxed line-clamp-3 ${secondaryTextColor}`}>{excerpt}</p>}

                <div className="pt-2 text-xs font-bold text-gray-400 flex items-center">
                    <span>Read More</span>
                    <span className="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
                </div>
            </div>
        </div>
    )
}
