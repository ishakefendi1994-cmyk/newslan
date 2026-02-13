'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Search, User, ShoppingBag, Zap, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AdRenderer from '../news/AdRenderer'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [headerAd, setHeaderAd] = useState<any>(null)
    const [menus, setMenus] = useState<{ [key: string]: any[] }>({})
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: cats } = await supabase.from('categories').select('*').order('display_order')
            if (cats) setCategories(cats)

            const { data: navLinks } = await supabase
                .from('navigation_links')
                .select('*')
                .eq('is_active', true)
                .order('display_order')

            if (navLinks) {
                const grouped = navLinks.reduce((acc: any, link: any) => {
                    if (!acc[link.location]) acc[link.location] = []
                    acc[link.location].push(link)
                    return acc
                }, {})
                setMenus(grouped)
            }

            const { data: ads } = await supabase
                .from('advertisements')
                .select('*')
                .eq('placement', 'header_bottom')
                .eq('is_active', true)
                .limit(1)

            if (ads && ads.length > 0) setHeaderAd(ads[0])
        }
        fetchData()
    }, [])

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white border-b border-black">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Left: Logo & Menu Toggle */}
                        <div className="flex items-center space-x-4">
                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="lg:hidden p-1 text-black hover:bg-gray-100 focus:outline-none"
                            >
                                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>

                            {/* Logo */}
                            <Link href="/" className="flex items-center shrink-0">
                                <NextImage
                                    src="/logo.png"
                                    alt="NEWSLAN.ID Logo"
                                    width={400}
                                    height={100}
                                    className="h-8 w-auto object-contain"
                                    priority
                                    quality={100}
                                    unoptimized
                                />
                            </Link>

                            {/* Desktop Categories */}
                            <div className="hidden lg:flex items-center space-x-6 ml-6">
                                {categories.slice(0, 6).map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.slug}`}
                                        className="text-sm font-bold text-black hover:text-primary transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                {/* More dropdown could go here */}
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center space-x-4">
                            <button className="hidden sm:flex p-1 hover:text-primary transition-colors text-black">
                                <Search className="w-5 h-5" />
                            </button>

                            <Link
                                href="/auth/login"
                                className="hidden sm:flex text-sm font-bold text-black hover:text-primary transition-colors"
                            >
                                Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <div className="lg:hidden bg-white border-b border-black animate-in slide-in-from-top duration-200 absolute w-full left-0 top-16 shadow-xl h-screen overflow-y-auto pb-40">
                        <div className="p-4 space-y-6">
                            <div className="space-y-1">
                                <p className="text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Sections</p>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/category/${cat.slug}`}
                                        className="block py-2 text-xl font-bold text-black hover:text-primary border-b border-gray-100"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">More</p>
                                <Link href="/auth/login" className="block py-2 text-lg font-bold text-gray-600" onClick={() => setIsOpen(false)}>Login</Link>
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
