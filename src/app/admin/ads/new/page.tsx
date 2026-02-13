'use client'

import { useState } from 'react'
import { Save, ChevronLeft, Image as ImageIcon, Loader2, Check, AlertCircle, Code, Layout } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/storage'

const placements = [
    { id: 'header_bottom', label: 'Below Menu (Header)' },
    { id: 'article_before', label: 'Before Article Content' },
    { id: 'article_middle', label: 'Middle of Article' },
    { id: 'article_after', label: 'After Article Content' },
    { id: 'sidebar', label: 'Sidebar (News Detail)' },
    { id: 'section_sidebar', label: 'Category Section Sidebar' },
    { id: 'feed_between', label: 'Between Feed Items' }
]

export default function NewAdPage() {
    const router = useRouter()
    const supabase = createClient()

    // Form State
    const [title, setTitle] = useState('')
    const [type, setType] = useState<'image' | 'html' | 'product_list'>('image')
    const [placement, setPlacement] = useState('article_middle')
    const [linkUrl, setLinkUrl] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [width, setWidth] = useState<number | ''>('')
    const [height, setHeight] = useState<number | ''>('')
    const [htmlContent, setHtmlContent] = useState('')
    const [isActive, setIsActive] = useState(true)

    // Product List State
    const [allProducts, setAllProducts] = useState<any[]>([])
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useState(() => {
        fetchProducts()
    })

    async function fetchProducts() {
        const { data } = await supabase.from('products').select('*').order('name')
        if (data) setAllProducts(data)
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        try {
            setUploading(true)
            const file = e.target.files[0]
            const publicUrl = await uploadImage(file)
            setImageUrl(publicUrl)

            // Auto-detect dimensions
            const img = new Image()
            img.onload = () => {
                setWidth(img.width)
                setHeight(img.height)
            }
            img.src = publicUrl

            setStatus({ type: 'success', message: 'Ad image uploaded & size detected!' })
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error uploading image' })
        } finally {
            setUploading(false)
        }
    }

    async function handleSubmit() {
        if (!title) {
            setStatus({ type: 'error', message: 'Ad title is required.' })
            return
        }

        if (type === 'image' && !imageUrl) {
            setStatus({ type: 'error', message: 'Ad image is required for Image type.' })
            return
        }

        if (type === 'html' && !htmlContent) {
            setStatus({ type: 'error', message: 'HTML content is required for HTML type.' })
            return
        }

        if (type === 'product_list' && selectedProductIds.length === 0) {
            setStatus({ type: 'error', message: 'Select at least one product for the list.' })
            return
        }

        try {
            setLoading(true)
            setStatus(null)

            const { data: adData, error: adError } = await supabase.from('advertisements').insert({
                title,
                type,
                placement,
                link_url: type === 'image' ? linkUrl : null,
                image_url: type === 'image' ? imageUrl : null,
                width: type === 'image' && width !== '' ? width : null,
                height: type === 'image' && height !== '' ? height : null,
                html_content: type === 'html' ? htmlContent : null,
                is_active: isActive
            }).select().single()

            if (adError) throw adError

            // If it's a product list, link the products
            if (type === 'product_list' && adData) {
                const junctionData = selectedProductIds.map((pid, index) => ({
                    ad_id: adData.id,
                    product_id: pid,
                    display_order: index
                }))
                const { error: junctionError } = await supabase.from('ad_products').insert(junctionData)
                if (junctionError) throw junctionError
            }

            setStatus({ type: 'success', message: 'Advertisement created successfully!' })
            setTimeout(() => router.push('/admin/ads'), 1500)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Error saving advertisement' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/ads" className="p-2 hover:bg-white rounded-none border-2 border-transparent hover:border-black transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">New Ad</h1>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Configure your advertisement</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {status && (
                        <div className={`flex items-center space-x-2 px-4 py-2 rounded-none border-2 font-black text-[10px] uppercase tracking-widest ${status.type === 'success' ? 'bg-green-50 border-green-600 text-green-600' : 'bg-red-50 border-red-600 text-red-600'}`}>
                            {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            <span>{status.message}</span>
                        </div>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || uploading}
                        className="bg-black text-white px-8 py-3 rounded-none font-black flex items-center space-x-2 hover:bg-gray-800 transition-all shadow-[6px_6px_0px_0px_rgba(255,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{loading ? 'DEPLOYING...' : 'SAVE AD'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Settings */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-8 rounded-none border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-8">

                        {/* Title & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b-2 border-gray-100 pb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ad Campaign Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Ramadhan Sale 2024"
                                    className="w-full px-4 py-3 rounded-none bg-gray-50 border-2 border-black focus:ring-4 focus:ring-primary/10 outline-none text-sm font-black uppercase tracking-widest"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ad Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setType('image')}
                                        className={`flex flex-col items-center justify-center space-y-1 py-3 border-2 font-black text-[8px] uppercase tracking-widest transition-all ${type === 'image' ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(59,130,246,1)]' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        <span>Image</span>
                                    </button>
                                    <button
                                        onClick={() => setType('html')}
                                        className={`flex flex-col items-center justify-center space-y-1 py-3 border-2 font-black text-[8px] uppercase tracking-widest transition-all ${type === 'html' ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(168,85,247,1)]' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                    >
                                        <Code className="w-4 h-4" />
                                        <span>HTML</span>
                                    </button>
                                    <button
                                        onClick={() => setType('product_list')}
                                        className={`flex flex-col items-center justify-center space-y-1 py-3 border-2 font-black text-[8px] uppercase tracking-widest transition-all ${type === 'product_list' ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(255,0,0,1)]' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
                                    >
                                        <Layout className="w-4 h-4" />
                                        <span>Products</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Section: Conditional */}
                        {type === 'image' ? (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ad Banner Image</label>
                                    {imageUrl ? (
                                        <div className="relative aspect-video w-full rounded-none overflow-hidden border-4 border-black group">
                                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                <label className="bg-white text-black px-6 py-3 rounded-none text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                    Change Image
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full py-20 rounded-none border-4 border-dashed border-gray-200 flex flex-col items-center justify-center space-y-4 hover:bg-gray-50 transition-all text-gray-400 cursor-pointer">
                                            {uploading ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <ImageIcon className="w-10 h-10" />}
                                            <div className="text-center">
                                                <span className="text-xs font-black uppercase tracking-widest block">{uploading ? 'PROCESSING...' : 'UPLOAD AD BANNER'}</span>
                                                <span className="text-[10px] font-bold mt-1 block">MAX 2MB • JPG, PNG, WEBP</span>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                        </label>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destination URL</label>
                                    <input
                                        type="text"
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="https://advertiser-site.com/..."
                                        className="w-full px-4 py-3 rounded-none bg-gray-50 border-2 border-black focus:ring-4 focus:ring-primary/10 outline-none text-sm font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Width (pixels)</label>
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value) : '')}
                                            placeholder="Auto"
                                            className="w-full px-4 py-3 rounded-none bg-white border-2 border-black focus:ring-4 focus:ring-primary/10 outline-none text-sm font-black"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Height (pixels)</label>
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : '')}
                                            placeholder="Auto"
                                            className="w-full px-4 py-3 rounded-none bg-white border-2 border-black focus:ring-4 focus:ring-primary/10 outline-none text-sm font-black"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Dipesan otomatis saat upload. Bisa diubah manual bro.</p>
                            </div>
                        ) : type === 'html' ? (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">HTML Code / Script (e.g. AdSense)</label>
                                <textarea
                                    value={htmlContent}
                                    onChange={(e) => setHtmlContent(e.target.value)}
                                    rows={10}
                                    placeholder="Paste your ad script or HTML code here..."
                                    className="w-full px-4 py-3 rounded-none bg-black text-green-400 border-4 border-black focus:ring-4 focus:ring-primary/10 outline-none text-xs font-mono leading-relaxed"
                                />
                                <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 mt-2 font-bold text-[10px] uppercase tracking-widest border border-red-100">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>Warning: Scripts will be executed on the frontend. Ensure code is safe and trusted.</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Products for Ad List</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                                    {allProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => {
                                                if (selectedProductIds.includes(product.id)) {
                                                    setSelectedProductIds(selectedProductIds.filter(id => id !== product.id))
                                                } else {
                                                    setSelectedProductIds([...selectedProductIds, product.id])
                                                }
                                            }}
                                            className={`flex items-center space-x-3 p-3 border-2 cursor-pointer transition-all ${selectedProductIds.includes(product.id) ? 'border-primary bg-primary/5 shadow-[4px_4px_0px_0px_rgba(255,0,0,1)]' : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-black'}`}
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-white p-1">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                        <ImageIcon className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black uppercase truncate">{product.name}</p>
                                                <p className="text-[8px] font-bold text-gray-400">{product.price_range}</p>
                                            </div>
                                            {selectedProductIds.includes(product.id) && (
                                                <div className="w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-blue-50 border-2 border-blue-200 text-blue-700 font-black text-[10px] uppercase tracking-widest">
                                    {selectedProductIds.length} PRODUCTS SELECTED. USER WILL SEE THESE IN A VERTICAL LIST.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Config */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-none border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center">
                                <Layout className="w-3 h-3 mr-2" />
                                Ad Placement
                            </label>
                            <div className="space-y-2">
                                {placements.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPlacement(p.id)}
                                        className={`w-full text-left px-4 py-3 border-2 font-black text-[10px] uppercase tracking-widest transition-all ${placement === p.id ? 'bg-primary text-white border-black translate-x-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Campaign Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setIsActive(false)}
                                    className={`py-3 border-2 font-black text-xs uppercase tracking-widest transition-all ${!isActive ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}
                                >
                                    OFFLINE
                                </button>
                                <button
                                    onClick={() => setIsActive(true)}
                                    className={`py-3 border-2 font-black text-xs uppercase tracking-widest transition-all ${isActive ? 'bg-green-600 text-white border-green-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-400 border-gray-200'}`}
                                >
                                    LIVE
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-6 rounded-none border-4 border-yellow-600 shadow-[8px_8px_0px_0px_rgba(251,191,36,1)]">
                        <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 text-yellow-800">
                            <AlertCircle className="w-4 h-4" />
                            <span>Revenue Optimization</span>
                        </h4>
                        <p className="text-[10px] text-yellow-700 font-bold mt-2 leading-relaxed">
                            ADS PLACED AT THE MIDDLE OF ARTICLES USUALLY PERFORM 2.5X BETTER THAN FOOTER ADS. USE HIGH CONTRAST COLORS FOR EXTERNAL LINKS.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
