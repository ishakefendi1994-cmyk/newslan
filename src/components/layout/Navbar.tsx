'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Search, User, ShoppingBag, ChevronDown } from 'lucide-react'
import AdRenderer from '../news/AdRenderer'

interface NavbarProps {
    categories: any[]
    navLinks: any[]
    headerAd: any
    siteName?: string
    logoType?: 'text' | 'image'
    siteLogoUrl?: string
    siteDescription?: string
    activeTemplate?: string
    hideCategories?: boolean
}

import { useRouter } from 'next/navigation'

export default function Navbar({
    categories = [],
    navLinks = [],
    headerAd,
    siteName = 'NEWSLAN.ID',
    logoType = 'text',
    siteLogoUrl = '/logo.png',
    siteDescription = 'Portal Berita Terpercaya',
    activeTemplate = 'tempo',
    hideCategories = false
}: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [menus, setMenus] = useState<{ [key: string]: any[] }>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const [hoveredCat, setHoveredCat] = useState<any | null>(null)
    const [megaMenuArticles, setMegaMenuArticles] = useState<any[]>([])
    const [megaMenuLoading, setMegaMenuLoading] = useState(false)
    const timeoutRef = useState<ReturnType<typeof setTimeout> | null>(null)
    const router = useRouter()

    const handleCatEnter = (cat: any) => {
        if (timeoutRef[0]) clearTimeout(timeoutRef[0])
        setHoveredCat(cat)
    }

    const handleCatLeave = () => {
        const t = setTimeout(() => setHoveredCat(null), 180)
        timeoutRef[1](t)
    }

    // Fetch articles when category is hovered
    useEffect(() => {
        if (!hoveredCat || activeTemplate !== 'cnn') return
        setMegaMenuLoading(true)
        setMegaMenuArticles([])
        fetch(`/api/articles/by-category?slug=${hoveredCat.slug}&limit=4`)
            .then(r => r.json())
            .then(data => {
                setMegaMenuArticles(Array.isArray(data) ? data : [])
                setMegaMenuLoading(false)
            })
            .catch(() => setMegaMenuLoading(false))
    }, [hoveredCat, activeTemplate])

    useEffect(() => {
        if (navLinks) {
            const grouped = navLinks.reduce((acc: any, link: any) => {
                if (!acc[link.location]) acc[link.location] = []
                acc[link.location].push(link)
                return acc
            }, {})
            setMenus(grouped)
        }
    }, [navLinks])

    // Detect scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
            setIsOpen(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <>
            <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''} ${activeTemplate === 'cnn' ? 'bg-[#000000] text-white border-b border-white/10' : 'bg-white text-black border-b border-gray-100'}`}>
                {/* Top Bar: Logo & Actions — hidden on scroll for CNN */}
                <div className={`w-full transition-all duration-300 overflow-hidden ${activeTemplate === 'cnn' && isScrolled
                    ? 'lg:max-h-0 lg:opacity-0 lg:pointer-events-none'
                    : 'max-h-40 opacity-100'
                    } ${isScrolled ? 'border-b-0' : 'border-b border-gray-100/10'}`}>
                    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>

                            {/* Logo */}
                            <div className="flex-1 flex justify-start">
                                <Link href="/" className="flex items-center shrink-0">
                                    {activeTemplate === 'cnn' ? (
                                        <div className="bg-[#cc0000] px-3 py-1.5 text-white font-bold italic text-lg leading-none flex items-center justify-center tracking-wide">
                                            {siteName?.split('.')[0] || siteName}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start">
                                            {logoType === 'image' && siteLogoUrl ? (
                                                <div className="relative h-10 w-40 md:h-12 md:w-48 transition-all">
                                                    <NextImage
                                                        src={siteLogoUrl}
                                                        alt={siteName}
                                                        fill
                                                        className="object-contain object-left"
                                                        priority
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
                                                        {siteName.split('.')[0]}
                                                        {siteName.includes('.') && <span className="text-primary">.{siteName.split('.')[1]}</span>}
                                                    </span>
                                                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-0.5 pl-0.5">{siteDescription.split('.')[0]}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center space-x-4 absolute right-4 lg:static lg:flex-1 lg:justify-end">
                                {/* Search Bar (Desktop) - Hide when scrolled */}
                                {!isScrolled && (
                                    <div className={`hidden lg:flex items-center rounded px-3 py-1.5 w-64 border transition-colors ${activeTemplate === 'cnn' ? 'bg-white/10 border-white/20 focus-within:border-white' : 'bg-gray-50 border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black'}`}>
                                        <input
                                            type="text"
                                            placeholder="Cari tokoh, topik atau peristiwa"
                                            className={`bg-transparent border-none text-xs w-full focus:outline-none focus:ring-0 ${activeTemplate === 'cnn' ? 'text-white placeholder-gray-400' : 'text-black placeholder-gray-500'}`}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <button onClick={handleSearch} className="hover:text-primary transition-colors">
                                            <Search className={`w-4 h-4 ${activeTemplate === 'cnn' ? 'text-gray-400' : 'text-gray-400'}`} />
                                        </button>
                                    </div>
                                )}

                                {/* Live TV Button (CNN Only) */}
                                {activeTemplate === 'cnn' && (
                                    <button className="hidden md:flex items-center gap-2 bg-white/5 border border-white/20 px-4 py-2 hover:bg-white/10 transition-colors">
                                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white">{siteName?.split('.')[0] || siteName} TV</span>
                                    </button>
                                )}

                                {/* Icons */}
                                <div className={`flex items-center space-x-3 ${activeTemplate === 'cnn' ? 'text-white/70' : 'text-gray-500'}`}>
                                    {/* Search Icon - Show when scrolled */}
                                    {isScrolled && (
                                        <button
                                            onClick={() => router.push('/search')}
                                            className="hover:text-white transition-colors"
                                        >
                                            <Search className="w-5 h-5" />
                                        </button>
                                    )}
                                    <Link href="/auth/login" className="hover:text-white transition-colors">
                                        <User className="w-5 h-5" />
                                    </Link>
                                </div>

                                {/* Mobile Menu Toggle */}
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className={`lg:hidden p-1 focus:outline-none ml-2 rounded transition-colors ${activeTemplate === 'cnn' ? 'text-white hover:bg-white/10' : 'text-black hover:bg-gray-100'}`}
                                >
                                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Bar (Categories) */}
                {!hideCategories && (
                    <div
                        className={`hidden lg:block w-full border-b relative z-40 ${activeTemplate === 'cnn'
                            ? 'bg-[#000000] border-white/10'
                            : activeTemplate === 'detik'
                                ? 'bg-[#005596] border-[#00447a]'
                                : 'bg-white border-black'
                            }`}
                        onMouseLeave={activeTemplate === 'cnn' ? handleCatLeave : undefined}
                    >
                        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center h-10 space-x-5 overflow-x-auto no-scrollbar">

                                {/* Mini logo — hanya muncul saat scroll (CNN only) */}
                                {activeTemplate === 'cnn' && isScrolled && (
                                    <Link href="/" className="shrink-0 mr-4">
                                        <div className="bg-[#cc0000] px-2.5 py-1 text-white font-bold italic text-sm leading-none">
                                            {siteName?.split('.')[0] || siteName}
                                        </div>
                                    </Link>
                                )}

                                <Link
                                    href="/"
                                    className={`text-[11px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTemplate === 'cnn' ? 'text-white hover:text-red-500' : activeTemplate === 'detik' ? 'text-[#ffbe00] hover:text-white' : 'text-primary hover:text-black'}`}
                                >
                                    Home
                                </Link>
                                {categories.slice(0, 10).map((cat) => (
                                    activeTemplate === 'cnn' ? (
                                        <button
                                            key={cat.id}
                                            onMouseEnter={() => handleCatEnter(cat)}
                                            onClick={() => router.push(`/category/${cat.slug}`)}
                                            className={`text-[11px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap border-b-2 pb-0.5 ${hoveredCat?.id === cat.id
                                                ? 'text-white border-red-600'
                                                : 'text-white/80 border-transparent hover:text-white hover:border-red-600'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ) : (
                                        <Link
                                            key={cat.id}
                                            href={`/category/${cat.slug}`}
                                            className={`text-[11px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTemplate === 'detik' ? 'text-white hover:text-[#ffbe00]' : 'text-black/70 hover:text-black'}`}
                                        >
                                            {cat.name}
                                        </Link>
                                    )
                                ))}
                                <button className={`ml-auto shrink-0 transition-colors ${activeTemplate === 'cnn' ? 'text-white/50 hover:text-white' : activeTemplate === 'detik' ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                                    <Menu className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── Mega Menu (CNN only) — Berita per Kategori ── */}
                        {activeTemplate === 'cnn' && hoveredCat && (
                            <div
                                className="absolute left-0 w-full bg-[#111111] border-t border-white/10 shadow-2xl z-50"
                                style={{ animation: 'megaFadeIn 0.15s ease' }}
                                onMouseEnter={() => handleCatEnter(hoveredCat)}
                                onMouseLeave={handleCatLeave}
                            >
                                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1 h-5 bg-red-600" />
                                            <span className="text-white font-black text-[13px] uppercase tracking-widest">
                                                {hoveredCat.name}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/category/${hoveredCat.slug}`}
                                            className="text-[10px] font-black text-red-500 hover:text-white uppercase tracking-widest transition-colors"
                                            onClick={() => setHoveredCat(null)}
                                        >
                                            Lihat Semua →
                                        </Link>
                                    </div>

                                    {/* Artikel */}
                                    {megaMenuLoading ? (
                                        <div className="grid grid-cols-4 gap-4">
                                            {[...Array(4)].map((_, i) => (
                                                <div key={i} className="space-y-2 animate-pulse">
                                                    <div className="aspect-[16/10] rounded-sm bg-white/10" />
                                                    <div className="h-3 bg-white/10 rounded w-3/4" />
                                                    <div className="h-3 bg-white/10 rounded w-1/2" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : megaMenuArticles.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-5">
                                            {megaMenuArticles.map((art: any) => (
                                                <Link
                                                    key={art.id}
                                                    href={`/news/${art.slug}`}
                                                    className="group block space-y-2"
                                                    onClick={() => setHoveredCat(null)}
                                                >
                                                    <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-white/10">
                                                        {art.featured_image && (
                                                            <NextImage
                                                                src={art.featured_image}
                                                                alt={art.title}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        )}
                                                    </div>
                                                    <h4 className="text-[12px] font-bold text-white/70 group-hover:text-white leading-snug line-clamp-3 transition-colors">
                                                        {art.title}
                                                    </h4>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[12px] text-white/30 italic">Belum ada berita di kategori ini.</p>
                                    )}
                                </div>

                                <style>{`
                                    @keyframes megaFadeIn {
                                        from { opacity: 0; transform: translateY(-6px); }
                                        to   { opacity: 1; transform: translateY(0); }
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <div className={`lg:hidden border-t animate-in slide-in-from-top duration-200 absolute w-full left-0 top-[60px] shadow-xl h-screen overflow-y-auto pb-40 z-50 ${activeTemplate === 'cnn' ? 'bg-[#111111] border-white/10 text-white' : 'bg-white border-gray-100 text-black'}`}>
                        <div className="p-4 space-y-6">
                            {/* Mobile Search */}
                            <div className="flex items-center bg-gray-50 rounded px-3 py-2 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                                <input
                                    type="text"
                                    placeholder="Cari berita..."
                                    className="bg-transparent border-none text-sm text-black placeholder-gray-500 w-full focus:outline-none"
                                />
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>

                            <div className="space-y-1">
                                <p className={`text-xs font-black uppercase mb-3 tracking-widest pl-1 ${activeTemplate === 'cnn' ? 'text-white/40' : 'text-gray-400'}`}>Kategori</p>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.slug}`}
                                        className={`block py-3 text-lg font-bold border-b pl-1 transition-colors ${activeTemplate === 'cnn' ? 'text-white/80 hover:text-white border-white/5' : 'text-gray-800 hover:text-black border-gray-100'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="space-y-4 pt-4">
                                <Link
                                    href="/subscribe"
                                    className="block w-full text-center bg-[#0087c9] text-white py-3 rounded font-bold uppercase tracking-widest text-xs"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Langganan {siteName.split('.')[0]}+
                                </Link>
                                <Link
                                    href="/auth/login"
                                    className="block w-full text-center border border-gray-200 text-black py-3 rounded font-bold uppercase tracking-widest text-xs hover:bg-gray-50"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Masuk Akun
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Dynamic Header Ad */}
            {headerAd && (
                <div className="w-full border-b border-gray-200 bg-gray-50 py-4">
                    <div className="max-w-[72rem] mx-auto px-4">
                        <AdRenderer ad={headerAd} />
                    </div>
                </div>
            )}
        </>
    )
}
