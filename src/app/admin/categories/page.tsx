'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Save,
    Loader2,
    Check,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeOff,
    Palette
} from 'lucide-react'

// Helper function to determine if text should be white or black based on background color
function getContrastColor(hexColor: string) {
    if (!hexColor) return 'white'

    // Remove the hash if it exists
    const hex = hexColor.replace('#', '')

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Calculate brightness (YIQ formula)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000

    // If brightness is high (light color), use black text; otherwise use white text
    return brightness > 128 ? 'black' : 'white'
}

export default function AdminCategoriesPage() {
    const supabase = createClient()
    const [categories, setCategories] = useState<any[]>([])
    const [ads, setAds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true)
            await Promise.all([
                fetchCategories(),
                fetchAds()
            ])
            setLoading(false)
        }
        loadInitialData()
    }, [])

    async function fetchAds() {
        const { data } = await supabase
            .from('advertisements')
            .select('id, title')
            .eq('placement', 'section_sidebar')
            .eq('is_active', true)
        if (data) setAds(data)
    }

    async function fetchCategories() {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true })

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    async function updateCategory(id: string, updates: any) {
        try {
            setSaving(id)
            const { error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            setCategories(prev => prev.map(cat =>
                cat.id === id ? { ...cat, ...updates } : cat
            ))

            if (updates.display_order !== undefined) {
                setCategories(prev => [...prev].sort((a, b) => a.display_order - b.display_order))
            }

            setStatus({ type: 'success', message: 'Category updated successfully.' })
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setSaving(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading categories...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Categories</h1>
                    <p className="text-gray-500 text-sm">Manage category visibility and order on the home page.</p>
                </div>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl flex items-center space-x-3 ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-bold">{status.message}</span>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Category Name</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Slug</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center text-primary">Ads Stack (up to 3)</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center text-primary">Ad 2</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center text-primary">Ad 3</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center">Show on Home</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center">Display Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categories.map((category, index) => (
                                <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-gray-900">{category.name}</td>
                                    <td className="px-8 py-5 text-sm text-gray-400 font-medium">{category.slug}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="color"
                                                    value={category.bg_color || '#E11D48'}
                                                    onChange={(e) => updateCategory(category.id, { bg_color: e.target.value })}
                                                    className="w-8 h-8 rounded-lg overflow-hidden p-0 border-none cursor-pointer"
                                                />
                                                <span className="text-[10px] font-bold text-gray-400 font-mono uppercase">{category.bg_color || '#E11D48'}</span>
                                            </div>
                                            {/* Tempo Style Preview */}
                                            <div className="flex items-center space-x-2">
                                                <div className="w-1.5 h-6" style={{ backgroundColor: category.bg_color || '#E11D48' }} />
                                                <span
                                                    className="px-3 py-1 text-xs font-black uppercase tracking-widest italic"
                                                    style={{
                                                        backgroundColor: category.bg_color || '#E11D48',
                                                        color: getContrastColor(category.bg_color || '#E11D48')
                                                    }}
                                                >
                                                    {category.name}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-2 py-5">
                                        <select
                                            value={category.sidebar_ad_id || ''}
                                            onChange={(e) => updateCategory(category.id, { sidebar_ad_id: e.target.value || null })}
                                            className="w-full min-w-[150px] bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none transition-all"
                                        >
                                            <option value="">Slot 1: Empty</option>
                                            {ads.map(ad => (
                                                <option key={ad.id} value={ad.id}>{ad.title}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-5">
                                        <select
                                            value={category.sidebar_ad_2_id || ''}
                                            onChange={(e) => updateCategory(category.id, { sidebar_ad_2_id: e.target.value || null })}
                                            className="w-full min-w-[150px] bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none transition-all"
                                        >
                                            <option value="">Slot 2: Empty</option>
                                            {ads.map(ad => (
                                                <option key={ad.id} value={ad.id}>{ad.title}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-5">
                                        <select
                                            value={category.sidebar_ad_3_id || ''}
                                            onChange={(e) => updateCategory(category.id, { sidebar_ad_3_id: e.target.value || null })}
                                            className="w-full min-w-[150px] bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-widest outline-none transition-all"
                                        >
                                            <option value="">Slot 3: Empty</option>
                                            {ads.map(ad => (
                                                <option key={ad.id} value={ad.id}>{ad.title}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button
                                            onClick={() => updateCategory(category.id, { show_on_home: !category.show_on_home })}
                                            disabled={saving === category.id}
                                            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${category.show_on_home
                                                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                        >
                                            {saving === category.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                                category.show_on_home ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />
                                            }
                                            <span>{category.show_on_home ? 'Visible' : 'Hidden'}</span>
                                        </button>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center space-x-3">
                                            <input
                                                type="number"
                                                value={category.display_order || 0}
                                                onChange={(e) => updateCategory(category.id, { display_order: parseInt(e.target.value) })}
                                                className="w-16 px-3 py-2 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-gray-100 focus:ring-0 text-sm font-black text-center transition-all"
                                            />
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => updateCategory(category.id, { display_order: (category.display_order || 0) - 1 })}
                                                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => updateCategory(category.id, { display_order: (category.display_order || 0) + 1 })}
                                                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>
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
