'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    LayoutGrid,
    FileText,
    ImageIcon,
    Settings,
    LogOut,
    ShoppingBag,
    User,
    Menu,
    Video,
    Download,
    BarChart3,
    Megaphone,
    Folder,
    X,
    ChevronRight,
    Search,
    Bell,
    Newspaper,
    Sparkles
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = createClient()
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [siteName, setSiteName] = useState('CMS')

    useEffect(() => {
        const fetchSiteSettings = async () => {
            const { data } = await supabase
                .from('site_settings')
                .select('site_name')
                .eq('id', 'main')
                .single()

            if (data?.site_name) {
                setSiteName(data.site_name)
            }
        }
        fetchSiteSettings()
    }, [])

    const menuItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Articles', href: '/admin/articles', icon: FileText },
        { name: 'Categories', href: '/admin/categories', icon: Folder },
        { name: 'Menus', href: '/admin/menus', icon: Menu },
        { name: 'Advertisements', href: '/admin/ads', icon: Megaphone },
        { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
        { name: 'Products', href: '/admin/products', icon: ShoppingBag },
        { name: 'Kategori Produk', href: '/admin/product-categories', icon: LayoutGrid },
        { name: 'Shorts', href: '/admin/shorts', icon: Video },
        { name: 'Import WP', href: '/admin/import-wp', icon: Download },
        { name: 'RSS Auto-Grab', href: '/admin/rss-manager', icon: Newspaper },
        { name: 'RSS Auto-Jobs', href: '/admin/rss-jobs', icon: Newspaper },
        { name: 'AI Writer', href: '/admin/ai-writer', icon: Sparkles },
        { name: 'AI Auto-Jobs', href: '/admin/ai-auto-jobs', icon: Sparkles },
        { name: 'Aduan', href: '/admin/complaints', icon: Megaphone },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar Desktop */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] text-slate-300 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full h-full">
                    {/* Sidebar Header */}
                    <div className="p-8 flex items-center justify-between">
                        <Link href="/admin" className="flex items-center space-x-3 group">
                            <span className="text-xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">{siteName} <span className="text-slate-500 font-normal text-xs">v1</span></span>
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${active
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'group-hover:text-primary'} transition-colors`} />
                                        <span>{item.name}</span>
                                    </div>
                                    {active && <ChevronRight className="w-4 h-4 opacity-50" />}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-6 mt-auto border-t border-slate-800">
                        <button className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-all">
                            <LogOut className="w-5 h-5" />
                            <span>Logout Dashboard</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 lg:ml-72 min-h-screen flex flex-col">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden sm:flex items-center bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 w-64 md:w-96 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <Search className="w-4 h-4 text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Cari konten atau menu..."
                                className="bg-transparent border-none focus:ring-0 text-sm w-full text-slate-600 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>
                        <Link href="/admin/profile" className="flex items-center space-x-3 group">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-slate-900 leading-none">Admin Newslan</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 tracking-wider">Super Administrator</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                                A
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Main View Area */}
                <main className="flex-1 p-4 sm:p-8">
                    <div className="max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
