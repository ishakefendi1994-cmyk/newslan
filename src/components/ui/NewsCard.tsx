import Link from 'next/link'
import Image from 'next/image'

interface NewsCardProps {
    title: string
    slug: string
    image: string
    category: string
    categoryColor?: string
    excerpt?: string
    isPremium?: boolean
    isDark?: boolean
    variant?: 'default' | 'large' | 'compact'
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
    variant = 'default'
}: NewsCardProps) {
    const textColor = isDark ? 'text-white' : 'text-black'
    const secondaryTextColor = isDark ? 'text-gray-300' : 'text-gray-500'
    const borderColor = isDark ? 'border-white/10' : 'border-gray-50'
    const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'

    if (variant === 'large') {
        return (
            <div className={`group grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden h-full ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                {/* Large Image - 8 cols */}
                <div className="md:col-span-8 relative aspect-video md:aspect-auto h-[300px] md:h-full overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                    {isPremium && (
                        <div className="absolute top-0 left-0 bg-yellow-400 text-black text-xs font-bold px-3 py-1 uppercase tracking-widest">
                            Premium
                        </div>
                    )}
                </div>
                {/* Content - 4 cols */}
                <div className="md:col-span-4 flex flex-col justify-center space-y-4 py-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-green-600">
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className={`text-2xl md:text-3xl font-bold leading-tight hover:text-green-600 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                            {title}
                        </h3>
                    </Link>
                    {excerpt && <p className={`${secondaryTextColor} text-sm leading-relaxed line-clamp-4`}>{excerpt}</p>}
                    <div className="mt-auto pt-4 flex items-center text-xs font-bold text-gray-400">
                        {/* Author or Time could go here */}
                        <span>Read More &rarr;</span>
                    </div>
                </div>
            </div>
        )
    }

    if (variant === 'compact') {
        return (
            <div className={`group flex flex-row items-start space-x-4 p-4 border-b border-gray-100 ${isDark ? 'bg-transparent border-white/10' : 'bg-white'}`}>
                <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 block mb-1">
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h4 className={`text-base font-bold leading-snug hover:text-green-600 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                            {title}
                        </h4>
                    </Link>
                    {/* Timestamp or Author */}
                </div>
                <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-gray-100">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            </div>
        )
    }

    // Default Card (Vertical)
    return (
        <div className={`group flex flex-col space-y-4 pb-8 border-b border-gray-100 last:border-0 ${isDark ? 'bg-transparent border-white/10' : 'bg-white'}`}>
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                />
                {isPremium && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-2 py-1 uppercase tracking-widest">
                        Premium
                    </div>
                )}
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-green-600">
                    {category}
                </span>
                <Link href={`/news/${slug}`} className="block">
                    <h3 className={`text-xl font-bold leading-tight hover:text-green-600 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
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
