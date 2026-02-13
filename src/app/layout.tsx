import type { Metadata } from "next";
import Link from "next/link";
import NextImage from "next/image";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: "NEWSLAN.ID | Terpercaya, Newslan.id - Edukasi, Investigasi dan Terpercaya",
  description: "Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${merriweather.variable} antialiased selection:bg-primary/20`}>
        <div className="boxed-container transition-all duration-300">
          <Navbar />
          <main className="min-h-screen pb-20 lg:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>

        <footer className="bg-[#0f0f0f] text-white border-t border-white/5 py-20 mt-10">
          <div className="max-w-[72rem] mx-auto px-4 sm:px-6">
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
                    unoptimized
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
                  <p>WhatsApp: 0811-7248-008</p>
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
      </body>
    </html>
  );
}
