import LayoutWrapper from '@/components/layout/LayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { getSiteSettings } from '@/lib/settings'

export default async function FrontendLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const settings = await getSiteSettings()

    const getCachedLayoutData = unstable_cache(
        async () => {
            const [
                { data: cats },
                { data: navLinks },
                { data: headerAds },
                { data: skinAds },
                { data: footerPages }
            ] = await Promise.all([
                supabase.from('categories').select('*').order('display_order'),
                supabase.from('navigation_links').select('*').eq('is_active', true).order('display_order'),
                supabase.from('advertisements').select('*').eq('placement', 'header_bottom').eq('is_active', true).limit(1),
                supabase.from('advertisements').select('*').in('placement', ['skin_left', 'skin_right']).eq('is_active', true),
                supabase.from('pages').select('id, title, slug').eq('is_published', true).eq('is_footer', true).order('title')
            ])

            return {
                categories: cats || [],
                navLinks: navLinks || [],
                footerPages: footerPages || [],
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

    const { categories, navLinks, footerPages, headerAd, skinAds } = await getCachedLayoutData()

    return (
        <LayoutWrapper
            categories={categories}
            headerAd={headerAd}
            skinAds={skinAds}
            siteName={settings.site_name}
            logoType={settings.logo_type}
            siteLogoUrl={settings.site_logo_url}
            contactWhatsapp={settings.contact_whatsapp}
            contactEmail={settings.contact_email}
            site_url={settings.site_url}
            site_favicon_url={settings.site_favicon_url}
            siteDescription={settings.description}
            navLinks={[
                ...navLinks,
                ...footerPages.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    href: `/p/${p.slug}`,
                    is_footer: true,
                    is_active: true
                }))
            ]}
        >
            {children}
        </LayoutWrapper>
    )
}
