'use client'

import { usePathname } from 'next/navigation'
import Navbar from "./Navbar"
import BottomNav from "./BottomNav"
import SkinAds from "./SkinAds"
import Link from "next/link"
import NextImage from "next/image"

interface LayoutWrapperProps {
    children: React.ReactNode
    categories: any[]
    navLinks: any[]
    headerAd: any
    skinAds: { left: any, right: any }
}

export default function LayoutWrapper({ children, categories, navLinks, headerAd, skinAds }: LayoutWrapperProps) {
    const pathname = usePathname()
    // Admin routes check
    const isAdmin = pathname?.startsWith('/admin')

    if (isAdmin) {
        return <main className="min-h-screen bg-[#F8FAFC]">{children}</main>
    }

    return (
        <>
            <SkinAds skinAds={skinAds} />
            <div className="boxed-container transition-all duration-300">
                <Navbar categories={categories} navLinks={navLinks} headerAd={headerAd} />
                <main className="min-h-screen pb-20 lg:pb-0">
                    {children}
                </main>
                <BottomNav />
                <footer className="bg-[#0f0f0f] text-white border-t border-white/5 py-20 mt-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                            <div className="space-y-6">
                                <Link href="/">
                                    <NextImage
                                        src="/logo.png"
                                        alt="NEWSLAN.ID Logo"
                                        width={400}
                                        height={140}
                                        className="h-12 w-auto object-contain"
                                        quality={100}
                                    />
                                </Link>
                                <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                    Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat untuk mencerdaskan kehidupan bangsa.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Informasi</h4>
                                <ul className="space-y-3 text-sm font-bold">
                                    <li><Link href="/redaksi" className="text-gray-300 hover:text-white transition-colors">Redaksi</Link></li>
                                    <li><Link href="/company-profile" className="text-gray-300 hover:text-white transition-colors">Company Profile</Link></li>
                                    <li><Link href="/pedoman-media-siber" className="text-gray-300 hover:text-white transition-colors">Pedoman Media Siber</Link></li>
                                    <li><Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Kebijakan Privasi</Link></li>
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Layanan</h4>
                                <ul className="space-y-3 text-sm font-bold">
                                    <li><Link href="/subscribe" className="text-gray-300 hover:text-white transition-colors">Langganan</Link></li>
                                    <li><Link href="/shorts" className="text-gray-300 hover:text-white transition-colors">Video Shorts</Link></li>
                                    <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Kontak</Link></li>
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Kontak Kami</h4>
                                <div className="space-y-2 text-sm text-gray-400 font-medium">
                                    <p>WhatsApp: +62 823-7886-5775</p>
                                    <p>Email: redaksi@newslan.id</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-white/5 text-center">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                &copy; {new Date().getFullYear()} NEWSLAN.ID - Edukasi, Investigasi dan Terpercaya. Diterbitkan oleh PT. LINTAS AKTUAL NUSANTARA.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    )
}
