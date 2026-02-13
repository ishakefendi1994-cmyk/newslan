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
            <div className={`group grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden h-full ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                <div className="relative aspect-video md:aspect-auto h-[300px] md:h-full overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        unoptimized
                    />
                    {isPremium && (
                        <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter shadow-xl">
                            Premium
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center space-y-4 pr-4 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: categoryColor || '#e11d48' }}>{category}</span>
                    <Link href={`/news/${slug}`} className="block">
                        <h3 className={`text-2xl md:text-3xl font-black leading-tight transition-colors line-clamp-4 italic tracking-tighter ${isDark ? 'text-white group-hover:text-white/80' : 'text-black group-hover:text-red-600'}`}>
                            {title}
                        </h3>
                    </Link>
                    {excerpt && <p className={`${secondaryTextColor} text-sm leading-relaxed line-clamp-3`}>{excerpt}</p>}
                    <Link href={`/news/${slug}`} className={`text-xs font-bold uppercase tracking-widest flex items-center mt-auto ${isDark ? 'text-white hover:text-white/70' : 'text-black hover:text-red-600'}`}>
                        Baca Selengkapnya
                    </Link>
                </div>
            </div>
        )
    }

    if (variant === 'compact') {
        return (
            <div className={`group flex flex-col space-y-3 p-2 transition-colors ${isDark ? 'bg-transparent hover:bg-white/5' : 'bg-white hover:bg-gray-50'}`}>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                    />
                    {isPremium && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                            P
                        </div>
                    )}
                </div>
                <Link href={`/news/${slug}`} className="block">
                    <h4 className={`text-xs font-bold leading-snug transition-colors line-clamp-2 ${isDark ? 'text-white group-hover:text-white/80' : 'text-black group-hover:text-red-600'}`}>
                        {title}
                    </h4>
                </Link>
            </div>
        )
    }

    return (
        <div className={`group flex flex-col space-y-4 pb-6 border-b transition-colors ${borderColor} ${isDark ? 'bg-transparent' : 'bg-white'}`}>
            <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                />
                {isPremium && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                        Premium
                    </div>
                )}
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: categoryColor || '#e11d48' }}>{category}</span>
                <Link href={`/news/${slug}`} className="block">
                    <h3 className={`text-lg font-bold leading-tight transition-all line-clamp-2 italic tracking-tight ${isDark ? 'text-white group-hover:text-white/80' : 'text-black group-hover:text-red-600'}`}>
                        {title}
                    </h3>
                </Link>
                {excerpt && <p className={`text-xs line-clamp-2 leading-relaxed ${secondaryTextColor}`}>{excerpt}</p>}
            </div>
        </div>
    )
}
