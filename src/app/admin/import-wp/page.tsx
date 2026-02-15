'use client'

import { useState } from 'react'
import { Globe, Download, Loader2, Check, AlertCircle, ChevronRight, RefreshCw, FileText } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { fetchWPPosts, extractWPMedia, extractWPCategory, WPPost } from '@/lib/wordpress'
import { migrateImageToImgBB } from '@/app/actions/wordpress-import'
import { grantAdminAccess } from '@/app/actions/auth'

export default function WPImporterPage() {
    const supabase = createClient()
    const [wpUrl, setWpUrl] = useState('')
    const [posts, setPosts] = useState<WPPost[]>([])
    const [loading, setLoading] = useState(false)
    const [filterDate, setFilterDate] = useState('2025-01-01')
    const [importing, setImporting] = useState<number[]>([]) // track IDs being imported
    const [imported, setImported] = useState<number[]>([]) // track successfully imported IDs
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [migrateImages, setMigrateImages] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [isBulkImporting, setIsBulkImporting] = useState(false)

    async function handleFetch(reset: boolean = true) {
        if (!wpUrl) return
        try {
            setLoading(true)
            setStatus(null)

            const nextPage = reset ? 1 : currentPage + 1
            const perPage = 50

            // Convert simple date to ISO 8601 for WordPress API (e.g., 2025-01-01 -> 2025-01-01T00:00:00)
            const afterDate = filterDate ? `${filterDate}T00:00:00` : undefined
            const data = await fetchWPPosts(wpUrl, nextPage, perPage, afterDate)

            // Check which ones are already imported
            const { data: logs } = await supabase
                .from('wp_import_log')
                .select('wp_post_id')
                .in('wp_post_id', data.map(p => p.id))

            const alreadyImported = logs?.map(l => l.wp_post_id) || []

            if (reset) {
                setPosts(data)
                setImported(alreadyImported)
                setCurrentPage(1)
            } else {
                setPosts(prev => [...prev, ...data])
                setImported(prev => [...new Set([...prev, ...alreadyImported])])
                setCurrentPage(nextPage)
            }

            setHasMore(data.length === perPage)

            if (data.length === 0 && !reset) {
                setStatus({ type: 'success', message: 'No more posts found.' })
            }
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error fetching posts' })
        } finally {
            setLoading(false)
        }
    }

    async function handleImport(post: WPPost) {
        if (importing.includes(post.id) || imported.includes(post.id)) return

        try {
            setImporting(prev => [...prev, post.id])

            // 1. Get or Create Category
            const categoryName = extractWPCategory(post)
            let { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('name', categoryName)
                .single()

            if (!cat) {
                const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                const { data: newCat, error: catErr } = await supabase
                    .from('categories')
                    .insert({ name: categoryName, slug })
                    .select()
                    .single()
                if (catErr) throw catErr
                cat = newCat
            }

            // 2. Handle Image Migration
            let featuredImage = extractWPMedia(post)
            let content = post.content.rendered

            if (migrateImages) {
                // Migrate Featured Image
                if (featuredImage) {
                    try {
                        const newUrl = await migrateImageToImgBB(featuredImage)
                        featuredImage = newUrl
                    } catch (e) {
                        console.error('Failed to migrate featured image:', e)
                    }
                }

                // Migrate Content Images (Robust regex)
                const imgRegex = /<img[^>]+src=["']([^"']+)["']/g
                const matches = Array.from(content.matchAll(imgRegex))

                for (const match of matches) {
                    const oldUrl = match[1]
                    if (oldUrl.includes('imgbb.com')) continue // Already migrated or external

                    try {
                        const newUrl = await migrateImageToImgBB(oldUrl)
                        content = content.replace(oldUrl, newUrl)
                    } catch (e) {
                        console.error(`Failed to migrate content image: ${oldUrl}`, e)
                    }
                }
            }

            // 3. Insert Article
            const { data: article, error: artErr } = await supabase
                .from('articles')
                .insert({
                    title: post.title.rendered,
                    slug: post.slug,
                    content: content,
                    excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 160),
                    featured_image: featuredImage,
                    category_id: cat?.id,
                    is_published: true,
                    created_at: post.date
                })
                .select()
                .single()

            if (artErr) throw artErr

            // 3. Log Import
            await supabase.from('wp_import_log').insert({
                wp_post_id: post.id,
                article_id: article.id
            })

            setImported(prev => [...prev, post.id])
        } catch (error: any) {
            console.error('Import error:', error)
            setStatus({ type: 'error', message: `Failed to import "${post.title.rendered}": ${error.message}` })
        } finally {
            setImporting(prev => prev.filter(id => id !== post.id))
        }
    }

    async function handleBulkImport() {
        const toImport = posts.filter(p => !imported.includes(p.id))
        if (toImport.length === 0) return

        if (!confirm(`Import ${toImport.length} articles automatically? This might take a while.`)) return

        setIsBulkImporting(true)
        setStatus({ type: 'success', message: `Bulk import started for ${toImport.length} articles...` })

        let successCount = 0
        let failCount = 0

        for (const post of toImport) {
            try {
                // We reuse handleImport logic but wait for it
                await handleImport(post)
                successCount++
            } catch (error) {
                console.error(`Bulk import failed for ${post.id}:`, error)
                failCount++
            }
        }

        setIsBulkImporting(false)
        setStatus({
            type: successCount > 0 ? 'success' : 'error',
            message: `Bulk import completed: ${successCount} success, ${failCount} failed.`
        })
    }

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">WordPress Importer</h1>
                    <p className="text-gray-500 text-sm">Transfer your content from WordPress to NewsLan.id.</p>
                </div>
                {posts.length > 0 && (
                    <button
                        onClick={handleBulkImport}
                        disabled={isBulkImporting || importing.length > 0}
                        className="bg-black text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                    >
                        {isBulkImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                        <span>Import All Visible ({posts.filter(p => !imported.includes(p.id)).length})</span>
                    </button>
                )}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">WordPress Site URL</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="url"
                                value={wpUrl}
                                onChange={(e) => setWpUrl(e.target.value)}
                                placeholder="https://your-wordpress-site.com"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-gray-100 focus:ring-0 text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-400">Import After Date</label>
                        <div className="flex gap-4">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-gray-100 focus:ring-0 text-sm transition-all shadow-inner"
                            />
                            <button
                                onClick={() => handleFetch(true)}
                                disabled={loading || !wpUrl}
                                className="bg-primary text-white px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                <span className="hidden sm:inline">{loading ? 'Fetching...' : 'Fetch Posts'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-gray-50">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={migrateImages}
                            onChange={(e) => setMigrateImages(e.target.checked)}
                            className="w-5 h-5 rounded-lg border-gray-200 text-black focus:ring-black transition-all cursor-pointer"
                        />
                        <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">Pindahkan Gambar ke ImgBB Otomatis</span>
                    </label>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">(Recommended)</span>
                </div>

                {status && (
                    <div className={`p-4 rounded-2xl flex flex-col space-y-2 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <div className="flex items-center space-x-3">
                            {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="text-sm font-bold">{status.message}</span>
                        </div>
                        {status.type === 'error' && (
                            <div className="pl-8">
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await grantAdminAccess()
                                            if (res.success) {
                                                alert(res.message)
                                                window.location.reload()
                                            } else {
                                                alert('Failed: ' + res.message)
                                            }
                                        } catch (e: any) {
                                            alert('Error: ' + e.message)
                                        }
                                    }}
                                    className="text-xs underline font-bold hover:text-red-800"
                                >
                                    Fix Permissions (Grant Admin)
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {posts.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-black text-xl tracking-tighter">Recent Posts ({posts.length})</h2>
                        <span className="text-xs font-bold text-gray-400">Found {posts.length} articles available for import</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {posts.map((post) => (
                            <div key={post.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-50">
                                        {extractWPMedia(post) ? (
                                            <img src={extractWPMedia(post)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 line-clamp-1">{post.title.rendered}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                {extractWPCategory(post)}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(post.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleImport(post)}
                                    disabled={importing.includes(post.id) || imported.includes(post.id)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${imported.includes(post.id)
                                        ? 'bg-green-50 text-green-600 cursor-default'
                                        : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 disabled:opacity-50'
                                        }`}
                                >
                                    {importing.includes(post.id) ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Importing...</span>
                                        </>
                                    ) : imported.includes(post.id) ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Imported</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Import</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="p-8 border-t border-gray-50 text-center">
                            <button
                                onClick={() => handleFetch(false)}
                                disabled={loading}
                                className="inline-flex items-center space-x-2 text-sm font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                <span>{loading ? 'Memuat...' : 'Load More Articles'}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!loading && posts.length === 0 && wpUrl && (
                <div className="py-20 text-center space-y-4">
                    <Globe className="w-12 h-12 text-gray-100 mx-auto" />
                    <p className="text-gray-400 font-bold">Connect your site to see available content.</p>
                </div>
            )}
        </div>
    )
}
