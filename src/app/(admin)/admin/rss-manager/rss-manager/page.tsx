'use client'

import { useState } from 'react'
import { Newspaper, Sparkles, Download, AlertCircle, CheckCircle, Loader2, DollarSign } from 'lucide-react'

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
    const [isPublished, setIsPublished] = useState<boolean>(true) // Default to published

    // Step 1: Fetch RSS feeds
    const handleFetchRSS = async () => {
        setLoading(true)
        setError(null)
        setArticles([])

        try {
            const res = await fetch('/api/rss/fetch')
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
        setSavedArticleId(null) // Reset saved state
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
                    sourceName: selectedArticle.source
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
                    image: extractedContent.image || null,
                    sourceUrl: selectedArticle.link,
                    sourceName: selectedArticle.source,
                    categoryId: selectedCategoryId || undefined,
                    isPublished: isPublished // Use toggle state
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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                        <Newspaper className="w-10 h-10 text-[#990000]" />
                        RSS Auto-Grabber Testing
                    </h1>
                    <p className="text-gray-600">Test RSS feed fetching, content extraction, and AI rewriting</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-red-900">Error</h3>
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Step 1: Fetch RSS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="w-8 h-8 bg-[#990000] text-white rounded-full flex items-center justify-center text-sm font-black">1</span>
                                Fetch RSS Feeds
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">Fetch latest articles from configured RSS feeds</p>
                        </div>
                        <button
                            onClick={handleFetchRSS}
                            disabled={loading}
                            className="px-6 py-3 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#770000] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Fetching...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Fetch RSS
                                </>
                            )}
                        </button>
                    </div>

                    {articles.length > 0 && (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            <p className="text-sm font-bold text-gray-700 mb-2">Found {articles.length} articles:</p>
                            {articles.map((article, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleExtract(article)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedArticle?.link === article.link
                                        ? 'border-[#990000] bg-red-50'
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

                {/* Step 2: Extract Content */}
                {selectedArticle && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                                <span className="w-8 h-8 bg-[#990000] text-white rounded-full flex items-center justify-center text-sm font-black">2</span>
                                Extract Full Content
                            </h2>
                            <p className="text-sm text-gray-600">Extracted from: <a href={selectedArticle.link} target="_blank" rel="noopener" className="text-[#990000] underline">{selectedArticle.link}</a></p>
                        </div>

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

                                <button
                                    onClick={handleRewrite}
                                    disabled={loading}
                                    className="w-full px-6 py-3 bg-[#990000] text-white font-bold rounded-lg hover:bg-[#770000] disabled:opacity-50 flex items-center justify-center gap-2"
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
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                                    <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-black">
                                        <CheckCircle className="w-5 h-5" />
                                    </span>
                                    AI Rewritten Article
                                </h2>
                                <p className="text-sm text-gray-600">Model: {rewrittenArticle.model}</p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-gray-500">Cost Estimate</p>
                                <p className="text-2xl font-black text-green-600 flex items-center gap-1">
                                    <DollarSign className="w-5 h-5" />
                                    {rewrittenArticle.cost.toFixed(4)}
                                </p>
                                <p className="text-xs text-gray-500">{rewrittenArticle.tokensUsed} tokens</p>
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
                                    <label className="text-xs font-bold text-gray-700 mb-2 block">PILIH KATEGORI (OPSIONAL)</label>
                                    <select
                                        value={selectedCategoryId}
                                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="">-- Auto (kategori default) --</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Kosongkan untuk auto-assign ke kategori default</p>
                                </div>

                                {savedArticleId ? (
                                    <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                                        <p className="text-sm font-bold text-green-800 mb-2">✅ Artikel berhasil disimpan!</p>
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
                                                Save to Database
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
                            <li>Make sure you have set <code className="bg-blue-100 px-1 rounded">OPENROUTER_API_KEY</code> in .env.local</li>
                            <li>Click "Fetch RSS" to get latest articles from configured feeds</li>
                            <li>Click on any article to extract its full content</li>
                            <li>Click "Rewrite with AI" to rewrite the article using OpenRouter</li>
                            <li>Review the result and cost before saving</li>
                        </ol>
                    </div>
                )}

            </div>
        </div>
    )
}

/* Toggle added */