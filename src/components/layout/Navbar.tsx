'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Search, User, ShoppingBag, Zap, ChevronDown } from 'lucide-react'
import AdRenderer from '../news/AdRenderer'

interface NavbarProps {
    categories: any[]
    navLinks: any[]
    headerAd: any
}

import { useRouter } from 'next/navigation'

export default function Navbar({ categories = [], navLinks = [], headerAd }: NavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [menus, setMenus] = useState<{ [key: string]: any[] }>({})
    const [searchQuery, setSearchQuery] = useState('')
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
            <header className="sticky top-0 z-50 w-full bg-black text-white border-b border-[#333]">
                {/* Top Bar: Logo & Actions */}
                <div className="w-full border-b border-[#333]">
                    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-20 items-center">


                            {/* Logo (Centered on Desktop, Left on Mobile) */}
                            <div className="flex-1 flex justify-start">
                                <Link href="/" className="flex items-center shrink-0">
                                    <NextImage
                                        src="/logo.png"
                                        alt="NEWSLAN.ID Logo"
                                        width={400}
                                        height={100}
                                        className="h-10 w-auto object-contain"
                                        priority
                                        quality={100}
                                    />
                                </Link>
                            </div>

                            {/* Right: Actions (Search, Subscribe, User) */}
                            <div className="flex items-center space-x-4 absolute right-4 lg:static lg:flex-1 lg:justify-end">
                                {/* Search Bar (Desktop) */}
                                <div className="hidden lg:flex items-center bg-[#222] rounded px-3 py-1.5 w-64 border border-[#333]">
                                    <input
                                        type="text"
                                        placeholder="Cari tokoh, topik atau peristiwa"
                                        className="bg-transparent border-none text-xs text-gray-300 placeholder-gray-500 w-full focus:outline-none focus:ring-0"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <button onClick={handleSearch} className="hover:text-white transition-colors">
                                        <Search className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>

                                {/* Subscribe Button */}
                                <Link
                                    href="/subscribe"
                                    className="hidden sm:flex bg-[#0087c9] hover:bg-[#0077b3] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors items-center"
                                >
                                    Newslan+
                                </Link>

                                {/* Icons */}
                                <div className="flex items-center space-x-3 text-gray-400">
                                    <button className="hover:text-white transition-colors">
                                        <Zap className="w-5 h-5" />
                                    </button>
                                    <Link href="/auth/login" className="hover:text-white transition-colors">
                                        <User className="w-5 h-5" />
                                    </Link>
                                </div>

                                {/* Mobile Menu Toggle */}
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="lg:hidden p-1 text-white hover:bg-gray-800 focus:outline-none ml-2"
                                >
                                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Bar (Categories) */}
                <div className="hidden lg:block bg-black w-full border-b border-[#333]">
                    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center h-10 space-x-6 overflow-x-auto no-scrollbar">
                            <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-white hover:text-primary transition-colors whitespace-nowrap">
                                Home
                            </Link>
                            {categories.slice(0, 8).map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="text-[11px] font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                            <button className="ml-auto text-gray-400 hover:text-white">
                                <Menu className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <div className="lg:hidden bg-black border-t border-[#333] animate-in slide-in-from-top duration-200 absolute w-full left-0 top-20 shadow-xl h-screen overflow-y-auto pb-40 z-50">
                        <div className="p-4 space-y-6">
                            {/* Mobile Search */}
                            <div className="flex items-center bg-[#222] rounded px-3 py-2 border border-[#333]">
                                <input
                                    type="text"
                                    placeholder="Cari berita..."
                                    className="bg-transparent border-none text-sm text-gray-300 placeholder-gray-500 w-full focus:outline-none"
                                />
                                <Search className="w-4 h-4 text-gray-400" />
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-black text-gray-500 uppercase mb-3 tracking-widest">Kategori</p>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.slug}`}
                                        className="block py-3 text-lg font-bold text-gray-200 hover:text-white border-b border-[#222]"
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
                                    Langganan Newslan+
                                </Link>
                                <Link
                                    href="/auth/login"
                                    className="block w-full text-center border border-[#333] text-white py-3 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#222]"
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
