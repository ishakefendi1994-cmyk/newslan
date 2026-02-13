'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import {
    LayoutDashboard,
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
    Folder
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const menuItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Articles', href: '/admin/articles', icon: FileText },
        { name: 'Categories', href: '/admin/categories', icon: Folder },
        { name: 'Menus', href: '/admin/menus', icon: Menu },
        { name: 'Advertisements', href: '/admin/ads', icon: Megaphone },
        { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
        { name: 'Products', href: '/admin/products', icon: ShoppingBag },
        { name: 'Shorts', href: '/admin/shorts', icon: Video },
        { name: 'Import WP', href: '/admin/import-wp', icon: Download },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ]

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-black text-white p-6 space-y-8 z-50 hidden lg:block">
                <Link href="/" className="flex items-center space-x-2 px-2">
                    <NextImage
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={40}
                        className="h-8 w-auto object-contain brightness-0 invert"
                    />
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded text-white/60">CMS</span>
                </Link>

                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <item.icon className="w-5 h-5 group-hover:text-primary transition-colors" />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-8 left-6 right-6">
                    <button className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
