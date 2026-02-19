'use client'

import { usePathname } from 'next/navigation'
import Navbar from "./Navbar"
import BottomNav from "./BottomNav"
import SkinAds from "./SkinAds"
import Link from "next/link"
import NextImage from "next/image"
import WhatsAppButton from "../ui/WhatsAppButton"

interface LayoutWrapperProps {
    children: React.ReactNode
    categories: any[]
    navLinks: any[]
    headerAd: any
    skinAds: { left: any, right: any }
    siteName?: string
    logoType?: 'text' | 'image'
    siteLogoUrl?: string
    contactWhatsapp?: string
    contactEmail?: string
    site_favicon_url?: string
    site_url?: string
}

export default function LayoutWrapper({
    children,
    categories,
    navLinks,
    headerAd,
    skinAds,
    siteName = 'NEWSLAN.ID',
    logoType = 'text',
    siteLogoUrl = '/logo.png',
    contactWhatsapp = '+62 823-7886-5775',
    contactEmail = 'redaksi@newslan.id',
    site_url = ''
}: LayoutWrapperProps) {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/auth')

    if (isAdmin) return <>{children}</>

    return (
        <>
            <SkinAds skinAds={skinAds} />
            <Navbar
                categories={categories}
                navLinks={navLinks}
                headerAd={headerAd}
                siteName={siteName}
                logoType={logoType}
                siteLogoUrl={siteLogoUrl}
            />
            <div className="boxed-container transition-all duration-300">
                <main className="min-h-screen pb-20 lg:pb-0">
                    {children}
                </main>
                <BottomNav />
            </div>
            <footer className="bg-[#0f0f0f] text-white border-t border-white/5 py-20 mt-10">
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="space-y-6">
                            <Link href="/" className="flex flex-col items-start brightness-0 invert opacity-80">
                                {logoType === 'image' && siteLogoUrl ? (
                                    <div className="relative h-12 w-48 transition-all">
                                        <NextImage
                                            src={siteLogoUrl}
                                            alt={siteName}
                                            fill
                                            className="object-contain object-left"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                                        {siteName.split('.')[0]}
                                        {siteName.includes('.') && <span className="text-primary">.{siteName.split('.')[1]}</span>}
                                    </span>
                                )}
                            </Link>
                            <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat untuk mencerdaskan kehidupan bangsa.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Informasi</h4>
                            <ul className="space-y-3 text-sm font-bold">
                                {navLinks.filter(l => l.is_footer).length > 0 ? (
                                    navLinks.filter(l => l.is_footer).map((link: any) => (
                                        <li key={link.id}>
                                            <Link href={link.href} className="text-gray-300 hover:text-white transition-colors">
                                                {link.title}
                                            </Link>
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li><Link href="/p/redaksi" className="text-gray-300 hover:text-white transition-colors">Redaksi</Link></li>
                                        <li><Link href="/p/company-profile" className="text-gray-300 hover:text-white transition-colors">Company Profile</Link></li>
                                        <li><Link href="/p/pedoman-media-siber" className="text-gray-300 hover:text-white transition-colors">Pedoman Media Siber</Link></li>
                                        <li><Link href="/p/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Kebijakan Privasi</Link></li>
                                    </>
                                )}
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
                                <p>WhatsApp: {contactWhatsapp}</p>
                                <p>Email: {contactEmail}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 text-center">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} {siteName.toUpperCase()} - Edukasi, Investigasi dan Terpercaya. Diterbitkan oleh PT. LINTAS AKTUAL NUSANTARA.
                        </p>
                    </div>
                </div>
            </footer>
            <WhatsAppButton />
        </>
    )
}
