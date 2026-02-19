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
}

import { useRouter } from 'next/navigation'

export default function Navbar({
    categories = [],
    navLinks = [],
    headerAd,
    siteName = 'NEWSLAN.ID',
    logoType = 'text',
    siteLogoUrl = '/logo.png',
    siteDescription = 'Portal Berita Terpercaya'
}: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [menus, setMenus] = useState<{ [key: string]: any[] }>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [isScrolled, setIsScrolled] = useState(false)
    const router = useRouter()

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
            <header className={`sticky top-0 z-50 w-full bg-white text-black border-b border-gray-100 transition-all duration-300 ${isScrolled ? 'shadow-sm' : ''}`}>
                {/* Top Bar: Logo & Actions */}
                <div className={`w-full border-b border-gray-100 transition-all duration-300 ${isScrolled ? 'border-b-0' : ''}`}>
                    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-14' : 'h-20'}`}>

                            {/* Logo */}
                            <div className="flex-1 flex justify-start">
                                <Link href="/" className="flex items-center shrink-0">
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
                                </Link>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center space-x-4 absolute right-4 lg:static lg:flex-1 lg:justify-end">
                                {/* Search Bar (Desktop) - Hide when scrolled */}
                                {!isScrolled && (
                                    <div className="hidden lg:flex items-center bg-gray-50 rounded px-3 py-1.5 w-64 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
                                        <input
                                            type="text"
                                            placeholder="Cari tokoh, topik atau peristiwa"
                                            className="bg-transparent border-none text-xs text-black placeholder-gray-500 w-full focus:outline-none focus:ring-0"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <button onClick={handleSearch} className="hover:text-primary transition-colors">
                                            <Search className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                )}

                                {/* Subscribe Button - Hide when scrolled */}
                                {!isScrolled && (
                                    <Link
                                        href="/subscribe"
                                        className="hidden sm:flex bg-primary hover:opacity-90 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-all items-center"
                                    >
                                        {siteName.split('.')[0]}+
                                    </Link>
                                )}

                                {/* Icons */}
                                <div className="flex items-center space-x-3 text-gray-500">
                                    {/* Search Icon - Show when scrolled */}
                                    {isScrolled && (
                                        <button
                                            onClick={() => router.push('/search')}
                                            className="hover:text-black transition-colors"
                                        >
                                            <Search className="w-5 h-5" />
                                        </button>
                                    )}
                                    <Link href="/auth/login" className="hover:text-black transition-colors">
                                        <User className="w-5 h-5" />
                                    </Link>
                                </div>

                                {/* Mobile Menu Toggle */}
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="lg:hidden p-1 text-black hover:bg-gray-100 focus:outline-none ml-2 rounded"
                                >
                                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Bar (Categories) */}
                <div className="hidden lg:block bg-white w-full border-b border-black">
                    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center h-10 space-x-6 overflow-x-auto no-scrollbar">
                            <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-primary hover:text-black transition-colors whitespace-nowrap">
                                Home
                            </Link>
                            {categories.slice(0, 8).map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="text-[11px] font-bold uppercase tracking-widest text-black/70 hover:text-black transition-colors whitespace-nowrap"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                            <button className="ml-auto text-gray-400 hover:text-black">
                                <Menu className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <div className="lg:hidden bg-white border-t border-gray-100 animate-in slide-in-from-top duration-200 absolute w-full left-0 top-20 shadow-xl h-screen overflow-y-auto pb-40 z-50">
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
                                <p className="text-xs font-black text-gray-400 uppercase mb-3 tracking-widest pl-1">Kategori</p>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.slug}`}
                                        className="block py-3 text-lg font-bold text-gray-800 hover:text-black border-b border-gray-100 pl-1"
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
