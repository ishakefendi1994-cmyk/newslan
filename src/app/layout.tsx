import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: `${settings.site_name} | Portal Berita Terpercaya`,
    description: settings.description,
    icons: {
      icon: settings.site_favicon_url || '/favicon.ico',
      shortcut: settings.site_favicon_url || '/favicon.ico',
      apple: settings.site_favicon_url || '/favicon.ico',
    },
    verification: {
      google: 'u8cZGQ1OYtYad-py6DebKVpaUCdxNH2HuSQfzjCipoU',
    }
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings()

  return (
    <html lang="id" style={{ '--site-primary-color': settings.theme_color } as React.CSSProperties}>
      <body className={`${inter.className} ${merriweather.variable} antialiased selection:bg-primary/20`}>
        {children}
      </body>
    </html>
  );
}
