import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: "NEWSLAN.ID | Portal Berita Terpercaya",
  description: "Portal berita terpercaya dengan fokus pada edukasi, investigasi, dan pemberitaan akurat.",
};

import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()

  const getCachedLayoutData = unstable_cache(
    async () => {
      const [
        { data: cats },
        { data: navLinks },
        { data: headerAds },
        { data: skinAds }
      ] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('navigation_links').select('*').eq('is_active', true).order('display_order'),
        supabase.from('advertisements').select('*').eq('placement', 'header_bottom').eq('is_active', true).limit(1),
        supabase.from('advertisements').select('*').in('placement', ['skin_left', 'skin_right']).eq('is_active', true)
      ])

      return {
        categories: cats || [],
        navLinks: navLinks || [],
        headerAd: headerAds?.[0] || null,
        skinAds: {
          left: skinAds?.find((ad: any) => ad.placement === 'skin_left') || null,
          right: skinAds?.find((ad: any) => ad.placement === 'skin_right') || null
        }
      }
    },
    ['layout-data'],
    { revalidate: 60, tags: ['layout'] }
  )

  const { categories, navLinks, headerAd, skinAds } = await getCachedLayoutData()

  return (
    <html lang="id">
      <body className={`${inter.className} ${merriweather.variable} antialiased selection:bg-primary/20`}>
        <LayoutWrapper
          categories={categories}
          navLinks={navLinks}
          headerAd={headerAd}
          skinAds={skinAds}
        >
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
