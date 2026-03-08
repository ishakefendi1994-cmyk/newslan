import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    siteUrl?: string
    theme?: 'light' | 'dark'
}

export default function Breadcrumbs({ items, siteUrl = '', theme = 'light' }: BreadcrumbsProps) {

    // JSON-LD for Breadcrumbs
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: item.href ? `${siteUrl}${item.href}` : undefined
        }))
    }

    return (
        <nav className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-gray-400'} mb-6 flex-wrap gap-y-2`}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Link href="/" className={`flex items-center transition-colors shrink-0 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'}`}>
                <Home className="w-3 h-3 mr-1" />
                <span>Home</span>
            </Link>

            {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 min-w-0">
                    <ChevronRight className={`w-3 h-3 shrink-0 ${theme === 'dark' ? 'text-white/30' : 'text-gray-300'}`} />
                    {item.href ? (
                        <Link href={item.href} className={`transition-colors truncate max-w-[150px] sm:max-w-[300px] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-black'}`}>
                            {item.label}
                        </Link>
                    ) : (
                        <span className={`truncate max-w-[200px] sm:max-w-md ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    )
}
