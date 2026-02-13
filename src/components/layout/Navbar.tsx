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
            <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
                {/* Top Thick Bar */}
                <div className="h-1 w-full bg-[#0B2D72]" />

                <div className="border-b border-gray-100">
                    <div className="w-full px-4 sm:px-6">
                        <div className="flex justify-between h-20 items-center">
                            <div className="flex items-center space-x-8">
                                {/* Logo */}
                                <Link href="/" className="flex items-center shrink-0">
                                    <NextImage
                                        src="/logo.png"
                                        alt="NEWSLAN.ID Logo"
                                        width={440}
                                        height={140}
                                        className="h-12 w-auto object-contain"
                                        priority
                                        quality={100}
                                        unoptimized
                                    />
                                </Link>

                                {/* Utility Nav */}
                                <div className="hidden lg:flex items-center space-x-6 text-sm">
                                    <button className="flex items-center space-x-2 text-gray-700 font-bold hover:text-primary transition-colors">
                                        <Menu className="w-4 h-4" />
                                        <span>Menu</span>
                                    </button>
                                    {(menus.utility && menus.utility.length > 0) && <div className="h-4 w-[1px] bg-gray-200" />}
                                    {menus.utility?.map((link) => (
                                        <Link
                                            key={link.id}
                                            href={link.url}
                                            className="text-gray-600 font-medium hover:text-black flex items-center space-x-1"
                                        >
                                            {link.label === 'Newslan Plus' && (
                                                <div className="bg-red-600 text-white p-0.5 rounded-sm">
                                                    <Zap className="w-3 h-3 fill-current" />
                                                </div>
                                            )}
                                            <span>{link.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-3">
                                <button className="hidden sm:flex p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                    <Search className="w-5 h-5" />
                                </button>

                                {/* <Link
                                    href="/subscribe"
                                    className="bg-[#E11D48] text-white px-6 py-2 rounded-sm text-xs font-bold hover:bg-red-700 transition-all"
                                >
                                    Langganan
                                </Link> */}

                                <Link
                                    href="/auth/login"
                                    className="hidden sm:flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-sm text-xs font-bold hover:bg-gray-50 transition-all"
                                >
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>Masuk</span>
                                </Link>

                                {/* Mobile Menu Toggle */}
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="lg:hidden p-2 rounded-md text-gray-600 hover:text-black hover:bg-gray-100 focus:outline-none"
                                >
                                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Row (Sub-nav) */}
                <div className="hidden lg:block border-b border-gray-100 bg-white/50 overflow-x-auto scrollbar-hide">
                    <div className="w-full px-6">
                        <div className="flex items-center space-x-8 h-10">
                            {/* Categories */}
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="text-[11px] font-bold text-gray-500 uppercase tracking-wider hover:text-primary whitespace-nowrap transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}

                            {/* Custom Main Links */}
                            {menus.main?.map((link) => (
                                <Link
                                    key={link.id}
                                    href={link.url}
                                    className="text-[11px] font-bold text-gray-500 uppercase tracking-wider hover:text-primary whitespace-nowrap transition-colors border-l border-gray-100 pl-8"
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {(categories.length === 0 && (!menus.main || menus.main.length === 0)) && (
                                ['Politik', 'Hukum', 'Ekonomi', 'Lingkungan', 'Nasional', 'Dunia', 'Metro', 'Bisnis', 'Otomotif', 'Tekno'].map((name) => (
                                    <span key={name} className="text-[11px] font-bold text-gray-300 uppercase tracking-wider whitespace-nowrap">
                                        {name}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <div className="lg:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {menus.mobile?.map((link) => (
                                <Link
                                    key={link.id}
                                    href={link.url}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {(!menus.mobile || menus.mobile.length === 0) && ['News', 'Trending', 'Shorts', 'Products'].map((name) => (
                                <Link
                                    key={name}
                                    href={`/${name.toLowerCase()}`}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {name}
                                </Link>
                            ))}
                            <div className="pt-4 pb-2 border-t border-gray-100 px-3">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Kategori</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/category/${cat.slug}`}
                                            className="text-sm text-gray-600 hover:text-primary"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Dynamic Header Ad (Non-sticky, scrolls with content) */}
            {headerAd && (
                <div className="w-full border-b border-gray-100 bg-gray-50 py-2">
                    <div className="max-w-4xl mx-auto px-4">
                        <AdRenderer ad={headerAd} />
                    </div>
                </div>
            )}
        </>
    )
}
