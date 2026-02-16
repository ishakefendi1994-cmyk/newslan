import LayoutWrapper from '@/components/layout/LayoutWrapper'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'

export default async function FrontendLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
        <LayoutWrapper
            categories={categories}
            navLinks={navLinks}
            headerAd={headerAd}
            skinAds={skinAds}
        >
            {children}
        </LayoutWrapper>
    )
}
