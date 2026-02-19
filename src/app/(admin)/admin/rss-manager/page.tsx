'use client'

import { useState, useEffect } from 'react'
import { Newspaper, Sparkles, Download, AlertCircle, CheckCircle, Loader2, DollarSign, Copy, Plus } from 'lucide-react'
import { RSS_FEEDS } from '@/lib/rss/feeds'

interface RSSArticle {
    title: string
    link: string
    source: string
    pubDate: string
    hasImage: boolean
}

export default function RSSManagerPage() {
    const [loading, setLoading] = useState(false)
    const [articles, setArticles] = useState<RSSArticle[]>([])
    const [selectedArticle, setSelectedArticle] = useState<RSSArticle | null>(null)
    const [extractedContent, setExtractedContent] = useState<any>(null)
    const [rewrittenArticle, setRewrittenArticle] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [savedArticleId, setSavedArticleId] = useState<string | null>(null)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
    const [isPublished, setIsPublished] = useState<boolean>(true)
    const [useAIThumbnail, setUseAIThumbnail] = useState<boolean>(false)
    const [language, setLanguage] = useState<string>('id')

    // Custom RSS URL input
    const [customRssUrl, setCustomRssUrl] = useState<string>('')
    const [showRecommendations, setShowRecommendations] = useState(false)

    // Categories from database
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

    // Fetch categories on mount
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCategories(data)
                }
            })
            .catch(err => console.error('Failed to fetch categories:', err))
    }, [])

    // Step 1: Fetch RSS feeds (with optional custom URL)
    const handleFetchRSS = async () => {
        setLoading(true)
        setError(null)
        setArticles([])

        try {
            const url = customRssUrl
                ? `/api/rss/fetch-custom?url=${encodeURIComponent(customRssUrl)}`
                : '/api/rss/fetch'

            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                setArticles(data.articles)
            } else {
                setError(data.error)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Copy feed URL to clipboard
    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url)
        alert('✅ URL copied to clipboard!')
    }

    // Step 2: Extract full content from selected article
    const handleExtract = async (article: RSSArticle) => {
        setSelectedArticle(article)
        setLoading(true)
        setError(null)
        setExtractedContent(null)
        setRewrittenArticle(null)

        try {
            const res = await fetch('/api/rss/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: article.link })
            })

            const data = await res.json()

            if (data.success) {
                setExtractedContent(data.data)
            } else {
                setError(data.error)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Rewrite with AI
    const handleRewrite = async () => {
        setSavedArticleId(null)
        if (!extractedContent || !selectedArticle) return

        setLoading(true)
        setError(null)
        setRewrittenArticle(null)

        try {
            const res = await fetch('/api/rss/rewrite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: extractedContent.title,
                    content: extractedContent.content,
                    sourceName: selectedArticle.source,
                    useAIThumbnail: useAIThumbnail,
                    language: language
                })
            })

            const data = await res.json()

            if (data.success) {
                setRewrittenArticle(data.data)
            } else {
                setError(data.error)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Step 4: Save to Database
    const handleSave = async () => {
        if (!rewrittenArticle || !selectedArticle || !extractedContent) return

        setSaving(true)
        setError(null)

        try {
            const res = await fetch('/api/rss/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: rewrittenArticle.title,
                    content: rewrittenArticle.content,
                    excerpt: rewrittenArticle.excerpt,
                    image: rewrittenArticle.aiImage || extractedContent.image || null,
                    sourceUrl: selectedArticle.link,
                    sourceName: selectedArticle.source,
                    categoryId: selectedCategoryId || undefined,
                    isPublished: isPublished
                })
            })

            const data = await res.json()

            if (data.success) {
                setSavedArticleId(data.article.id)
            } else {
                setError(data.error)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                    <Newspaper className="w-8 h-8 text-[#990000]" />
                    RSS Auto-Grabber
                </h1>
                <p className="text-gray-600">Fetch, extract, rewrite with AI, and auto-publish articles from RSS feeds</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-red-900">Error</h3>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Step 1: Fetch RSS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 bg-[#990000] text-white rounded-full flex items-center justify-center text-sm font-black">1</span>
                    RSS Feed Input
                </h2>

                <div className="space-y-4">
                    {/* Category Selector - Visible from start */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">Pilih Kategori Artikel</label>
                        <select
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                        >
                            <option value="">-- Pilih Kategori --</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {selectedCategoryId ? '✅ Kategori dipilih' : 'Pilih kategori untuk artikel yang akan di-publish'}
                        </p>
                    </div>

                    {/* Custom URL Input */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">Custom RSS URL (Optional)</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={customRssUrl}
                                onChange={(e) => setCustomRssUrl(e.target.value)}
                                placeholder="https://example.com/rss atau kosongkan untuk use default feeds"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000]"
                            />
                            <button
                                onClick={() => setShowRecommendations(!showRecommendations)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Recommendations
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {customRssUrl ? '✅ Using custom feed' : 'Using default 5 feeds (CNN, Tempo, etc.)'}
                        </p>
                    </div>

                    {/* Recommendations Dropdown */}
                    {showRecommendations && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                            <h3 className="font-bold text-sm mb-3 text-gray-900">📋 Recommended RSS Feeds (Click to copy)</h3>
                            <div className="space-y-2">
                                {RSS_FEEDS.map((feed) => (
                                    <div
                                        key={feed.id}
                                        onClick={() => copyToClipboard(feed.url)}
                                        className="p-3 bg-white border border-gray-200 rounded-lg hover:border-[#990000] hover:bg-[#990000]/5 cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm">{feed.name}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-1">{feed.url}</p>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">
                                                    {feed.category}
                                                </span>
                                            </div>
                                            <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#990000] flex-shrink-0" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fetch Button */}
                    <button
                        onClick={handleFetchRSS}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#990000]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Fetching...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Fetch RSS {customRssUrl ? '(Custom)' : '(Default 5 Feeds)'}
                            </>
                        )}
                    </button>

                    {articles.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto mt-4">
                            <p className="text-sm font-bold text-gray-700">Found {articles.length} articles:</p>
                            {articles.map((article, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleExtract(article)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedArticle?.link === article.link
                                        ? 'border-[#990000] bg-[#990000]/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-sm line-clamp-2">{article.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {article.source} • {new Date(article.pubDate).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                        {article.hasImage && (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Image</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Step 2: Extract Content */}
            {selectedArticle && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                        <span className="w-8 h-8 bg-[#990000] text-white rounded-full flex items-center justify-center text-sm font-black">2</span>
                        Extract Full Content
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        From: <a href={selectedArticle.link} target="_blank" rel="noopener" className="text-[#990000] underline">{selectedArticle.link}</a>
                    </p>

                    {extractedContent && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-bold text-gray-500 mb-1">TITLE</p>
                                <h3 className="font-bold">{extractedContent.title}</h3>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs font-bold text-gray-500 mb-1">CONTENT ({extractedContent.contentLength} chars)</p>
                                <p className="text-sm text-gray-700 line-clamp-6">{extractedContent.content}</p>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setUseAIThumbnail(!useAIThumbnail)}>
                                <input
                                    type="checkbox"
                                    id="useAIThumbnail"
                                    checked={useAIThumbnail}
                                    onChange={(e) => setUseAIThumbnail(e.target.checked)}
                                    className="w-4 h-4 text-[#990000] border-gray-300 rounded focus:ring-[#990000]"
                                />
                                <label htmlFor="useAIThumbnail" className="text-sm text-gray-700 font-bold cursor-pointer flex items-center gap-2 select-none">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    Generate AI Thumbnail (Replicate)
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="text-sm font-bold text-gray-700 mb-2 block border-l-4 border-blue-600 pl-3">Target Bahasa AI</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-2 border border-blue-200 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-600 font-bold"
                                >
                                    <option value="id">🇮🇩 Bahasa Indonesia</option>
                                    <option value="en">🇺🇸 Bahasa Inggris (English)</option>
                                </select>
                            </div>

                            <button
                                onClick={handleRewrite}
                                disabled={loading}
                                className="w-full px-6 py-3 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#990000]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Rewriting with AI...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Rewrite with AI
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Rewritten Result */}
            {rewrittenArticle && (
                <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-yellow-500" />
                                AI Rewritten Article
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs font-bold text-green-700 mb-1">NEW TITLE</p>
                            <h3 className="font-bold text-lg">{rewrittenArticle.title}</h3>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs font-bold text-green-700 mb-1">EXCERPT</p>
                            <p className="text-sm text-gray-700">{rewrittenArticle.excerpt}</p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs font-bold text-green-700 mb-2">CONTENT</p>
                            <div
                                className="prose prose-sm max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: rewrittenArticle.content }}
                            />
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            {/* Category Selector */}
                            <div>
                                <label className="text-xs font-bold text-gray-700 mb-2 block">KATEGORI (OPSIONAL)</label>
                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {savedArticleId ? (
                                <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                                    <p className="text-sm font-bold text-green-800 mb-2">✅ Artikel berhasil di{isPublished ? 'publikasikan' : 'simpan'}!</p>
                                    <a
                                        href={`/admin/articles/${savedArticleId}`}
                                        target="_blank"
                                        className="text-sm text-green-700 underline hover:text-green-900"
                                    >
                                        Lihat artikel di admin panel →
                                    </a>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            {isPublished ? '📢 Publish Article' : '📝 Save as Draft'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            {!articles.length && !loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-blue-900 mb-2">Getting Started</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Enter a custom RSS URL or leave blank to use default feeds</li>
                        <li>Click "Recommendations" to see 26+ Indonesian news feeds</li>
                        <li>Click "Fetch RSS" to get latest articles</li>
                        <li>Click on any article to extract full content</li>
                        <li>Click "Rewrite with AI" to rewrite using OpenRouter</li>
                        <li>Review and publish or save as draft</li>
                    </ol>
                </div>
            )}
        </div>
    )
}


