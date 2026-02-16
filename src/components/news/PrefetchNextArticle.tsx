'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PrefetchNextArticle({ slug }: { slug?: string }) {
    const router = useRouter()

    useEffect(() => {
        if (slug) {
            router.prefetch(`/news/${slug}`)
        }
    }, [slug, router])

    return null
}
