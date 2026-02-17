'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Video, ShoppingBag, User } from 'lucide-react'

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Products', href: '/products', icon: ShoppingBag },
    { name: 'Video', href: '/shorts', icon: Video },
    { name: 'Profile', href: '/profile', icon: User },
]

export default function BottomNav() {
    const pathname = usePathname()

    // Don't show on admin pages
    if (pathname?.startsWith('/admin')) return null

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl bg-white border-t border-gray-100 z-50 lg:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
