'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, Filter, Search, Loader2, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function AdminArticlesPage() {
    const supabase = createClient()
    const [articles, setArticles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        fetchArticles()
    }, [])

    async function fetchArticles() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('articles')
                .select('*, categories(name)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setArticles(data || [])
        } catch (error) {
            console.error('Error fetching articles:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredArticles.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredArticles.map(a => a.id))
        }
    }

    async function handleBulkDelete() {
        if (!selectedIds.length || !confirm(`Are you sure you want to delete ${selectedIds.length} articles? This cannot be undone.`)) return

        try {
            setIsDeleting(true)
            const { error } = await supabase
                .from('articles')
                .delete()
                .in('id', selectedIds)

            if (error) throw error

            setArticles(prev => prev.filter(a => !selectedIds.includes(a.id)))
            setSelectedIds([])
            alert('Articles deleted successfully.')
        } catch (error: any) {
            console.error('Error deleting articles:', error)
            alert(`Failed to delete articles: ${error.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    async function handleDelete(id: string, title: string) {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) return

        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id)

            if (error) throw error
            setArticles(prev => prev.filter(a => a.id !== id))
            setSelectedIds(prev => prev.filter(i => i !== id))
        } catch (error: any) {
            alert(`Error: ${error.message}`)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Articles</h1>
                    <p className="text-gray-500 text-sm">Manage your news content and articles.</p>
                </div>
                <Link href="/admin/articles/new" className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
                    <Plus className="w-5 h-5" />
                    <span>New Article</span>
                </Link>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-gray-100 focus:ring-0 text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                            <span>Delete Selected ({selectedIds.length})</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filteredArticles.length && filteredArticles.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Article</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Category</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Performance</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        <span className="text-sm font-bold">Loading articles...</span>
                                    </td>
                                </tr>
                            ) : filteredArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <span className="text-sm font-bold">No articles found.</span>
                                    </td>
                                </tr>
                            ) : filteredArticles.map((article) => (
                                <tr key={article.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(article.id)}
                                            onChange={() => toggleSelect(article.id)}
                                            className="rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="relative w-16 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                                                {article.featured_image ? (
                                                    <Image
                                                        src={article.featured_image}
                                                        alt={article.title}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <FileText className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-gray-900 leading-snug tracking-tight truncate max-w-[300px]">{article.title}</span>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {article.is_premium && (
                                                        <Badge className="bg-yellow-50 text-yellow-600 border-yellow-100 text-[9px] px-1.5 py-0">PREMIUM</Badge>
                                                    )}
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                        {new Date(article.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black">{article.categories?.name || 'Uncategorized'}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${article.is_published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {article.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-1 text-gray-500">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold">{article.views_count || 0} views</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Link
                                                href={`/admin/articles/${article.id}`}
                                                className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-black"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(article.id, article.title)}
                                                className="p-2 hover:bg-red-50 rounded-xl transition-all text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
