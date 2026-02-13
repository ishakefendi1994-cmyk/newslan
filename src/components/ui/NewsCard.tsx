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
    variant?: 'default' | 'large' | 'compact' | 'techcrunch-hero' | 'techcrunch-list' | 'in-brief'
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

    // TechCrunch Hero: Large image with text overlay at bottom
    if (variant === 'techcrunch-hero') {
        return (
            <div className="group relative w-full h-[500px] md:h-[600px] overflow-hidden bg-black">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full max-w-4xl">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h2 className="text-4xl md:text-6xl font-bold text-white leading-[0.95] tracking-tighter hover:text-primary transition-colors mb-4">
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
            <div className="group flex flex-row justify-between items-start gap-6 py-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="flex-1 flex flex-col space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className="text-xl md:text-2xl font-bold leading-tight text-black group-hover:text-primary transition-colors">
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
                        unoptimized
                    />
                </div>
            </div>
        )
    }

    // In Brief: Tiny compact text only or with icon
    if (variant === 'in-brief') {
        return (
            <div className="group py-4 border-b border-gray-100 last:border-0">
                <div className="flex items-start space-x-3">
                    <div className="shrink-0 mt-1">
                        {/* TechCrunch green double diamond icon simulation */}
                        <div className="w-4 h-4 bg-primary skew-x-[-10deg]" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">In Brief</span>
                        <Link href={`/news/${slug}`} className="block">
                            <h4 className="text-base font-bold leading-tight text-black group-hover:text-primary transition-colors">
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
            <div className={`group flex flex-col md:flex-row gap-8 overflow-hidden h-full ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                {/* Large Image */}
                <div className="md:w-3/5 relative aspect-video md:aspect-auto h-[250px] md:h-full overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
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
                        <h3 className={`text-2xl md:text-3xl font-black leading-[1.1] tracking-tighter hover:text-primary transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
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

    if (variant === 'compact') {
        return (
            <div className={`group flex flex-row items-center space-x-4 py-6 border-b border-black/5 last:border-0 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                <div className="flex-1 space-y-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-primary'}`}>
                        {category}
                    </span>
                    <Link href={`/news/${slug}`} className="block">
                        <h4 className={`text-base font-bold leading-tight hover:text-primary transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
                            {title}
                        </h4>
                    </Link>
                </div>
                <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-gray-100 border border-black/5">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
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
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {category}
                </span>
                <Link href={`/news/${slug}`} className="block">
                    <h3 className={`text-xl font-bold leading-tight hover:text-primary transition-colors ${isDark ? 'text-white' : 'text-black'}`}>
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
