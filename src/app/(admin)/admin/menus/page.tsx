'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Menu as MenuIcon,
    Plus,
    Save,
    Loader2,
    Check,
    AlertCircle,
    Trash2,
    ArrowUp,
    ArrowDown,
    ExternalLink,
    Layout
} from 'lucide-react'

export default function AdminMenusPage() {
    const supabase = createClient()
    const [menus, setMenus] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Form state for new/editing menu
    const [editingMenu, setEditingMenu] = useState<any>(null)
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        fetchMenus()
    }, [])

    async function fetchMenus() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('navigation_links')
                .select('*')
                .order('location', { ascending: true })
                .order('display_order', { ascending: true })

            if (error) throw error
            setMenus(data || [])
        } catch (error) {
            console.error('Error fetching menus:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(menu: any) {
        try {
            setSaving(menu.id || 'new')
            const { id, ...data } = menu

            let error
            if (id) {
                const { error: err } = await supabase
                    .from('navigation_links')
                    .update(data)
                    .eq('id', id)
                error = err
            } else {
                const { error: err } = await supabase
                    .from('navigation_links')
                    .insert([data])
                error = err
            }

            if (error) throw error

            setStatus({ type: 'success', message: 'Menu saved successfully.' })
            setEditingMenu(null)
            setIsAdding(false)
            fetchMenus()
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setSaving(null)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this menu item?')) return

        try {
            setSaving(id)
            const { error } = await supabase
                .from('navigation_links')
                .delete()
                .eq('id', id)

            if (error) throw error

            setMenus(prev => prev.filter(m => m.id !== id))
            setStatus({ type: 'success', message: 'Menu deleted successfully.' })
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setSaving(null)
        }
    }

    async function updateOrder(id: string, newOrder: number) {
        try {
            const { error } = await supabase
                .from('navigation_links')
                .update({ display_order: newOrder })
                .eq('id', id)

            if (error) throw error
            fetchMenus()
        } catch (error: any) {
            console.error(error)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading menus...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">Navigation Menus</h1>
                    <p className="text-gray-500 text-sm">Configure site navigation links, locations, and order.</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true)
                        setEditingMenu({ label: '', url: '', location: 'main', display_order: 0, is_active: true })
                    }}
                    className="inline-flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-primary transition-all shadow-lg hover:shadow-primary/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add New Menu</span>
                </button>
            </div>

            {status && (
                <div className={`p-4 rounded-2xl flex items-center justify-between ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <div className="flex items-center space-x-3">
                        {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold">{status.message}</span>
                    </div>
                    <button onClick={() => setStatus(null)} className="text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100">Dismiss</button>
                </div>
            )}

            {/* Editing/Adding Form */}
            {(isAdding || editingMenu) && (
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-primary/10 shadow-xl space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase tracking-tighter italic flex items-center space-x-2">
                            <MenuIcon className="w-6 h-6 text-primary" />
                            <span>{editingMenu?.id ? 'Edit Menu Item' : 'Create New Menu Item'}</span>
                        </h2>
                        <button
                            onClick={() => { setIsAdding(false); setEditingMenu(null); }}
                            className="text-gray-400 hover:text-black"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Label</label>
                            <input
                                type="text"
                                value={editingMenu?.label || ''}
                                onChange={e => setEditingMenu({ ...editingMenu, label: e.target.value })}
                                placeholder="e.g. Home, Politik, Trending"
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 focus:ring-0 font-bold transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">URL / Link</label>
                            <input
                                type="text"
                                value={editingMenu?.url || ''}
                                onChange={e => setEditingMenu({ ...editingMenu, url: e.target.value })}
                                placeholder="e.g. /, /category/politik, https://..."
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 focus:ring-0 font-bold transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Location</label>
                            <select
                                value={editingMenu?.location || 'main'}
                                onChange={e => setEditingMenu({ ...editingMenu, location: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 focus:ring-0 font-bold transition-all appearance-none"
                            >
                                <option value="utility">Utility (Top White Bar)</option>
                                <option value="main">Main (Category Row)</option>
                                <option value="mobile">Mobile Menu</option>
                                <option value="footer">Footer</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Display Order</label>
                                <input
                                    type="number"
                                    value={editingMenu?.display_order || 0}
                                    onChange={e => setEditingMenu({ ...editingMenu, display_order: parseInt(e.target.value) })}
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 focus:ring-0 font-bold transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Status</label>
                                <div className="flex items-center h-[60px] ml-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingMenu?.is_active}
                                            onChange={e => setEditingMenu({ ...editingMenu, is_active: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        <span className="ml-3 text-sm font-bold text-gray-700">{editingMenu?.is_active ? 'Active' : 'Inactive'}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            onClick={() => { setIsAdding(false); setEditingMenu(null); }}
                            className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSave(editingMenu)}
                            disabled={saving === (editingMenu?.id || 'new')}
                            className="bg-black text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center space-x-2"
                        >
                            {saving === (editingMenu?.id || 'new') ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span>Save Menu Item</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Menus List grouped by location */}
            {['utility', 'main', 'mobile', 'footer'].map(loc => {
                const locMenus = menus.filter(m => m.location === loc)
                if (locMenus.length === 0 && !isAdding) return null

                return (
                    <div key={loc} className="space-y-4">
                        <div className="flex items-center space-x-3 ml-4">
                            <Layout className="w-5 h-5 text-gray-300" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">
                                {loc === 'utility' ? 'Utility Menu (Top Bar)' :
                                    loc === 'main' ? 'Main Menu (Category Row)' :
                                        loc === 'mobile' ? 'Mobile Menu Overlay' : 'Footer Menu'}
                            </h3>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Order</th>
                                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Label</th>
                                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50">Link</th>
                                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center">Status</th>
                                            <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {locMenus.map((menu) => (
                                            <tr key={menu.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-black text-gray-900 w-4">{menu.display_order}</span>
                                                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => updateOrder(menu.id, menu.display_order - 1)} className="p-0.5 hover:text-primary"><ArrowUp className="w-3 h-3" /></button>
                                                            <button onClick={() => updateOrder(menu.id, menu.display_order + 1)} className="p-0.5 hover:text-primary"><ArrowDown className="w-3 h-3" /></button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="font-bold text-gray-900">{menu.label}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center space-x-2 text-sm text-gray-400 font-medium">
                                                        <span className="truncate max-w-[200px]">{menu.url}</span>
                                                        <ExternalLink className="w-3 h-3" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${menu.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {menu.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end space-x-3">
                                                        <button
                                                            onClick={() => setEditingMenu(menu)}
                                                            className="p-2 hover:bg-black hover:text-white rounded-xl transition-all"
                                                        >
                                                            <Plus className="w-4 h-4 rotate-45" /> {/* Use rotate-45 for "edit" look if no Edit icon imported */}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(menu.id)}
                                                            className="p-2 hover:bg-red-500 hover:text-white rounded-xl transition-all"
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
            })}
        </div>
    )
}
