import { Suspense } from 'react'
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, Tag, ExternalLink, Star, Package, CheckCircle2, ShoppingCart, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getProductById } from '@/lib/data'
import { formatRupiah } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import TrendingProductsContainer from '@/components/commerce/TrendingProductsContainer'

interface ProductPageProps {
    params: { id: string }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params
    const product = await getProductById(id)

    if (!product) return { title: 'Product Not Found' }

    return {
        title: `${product.name} - Harga Terbaik & Review | Newslan.id`,
        description: product.description?.replace(/<[^>]*>/g, '').substring(0, 160) || `Beli ${product.name} dengan harga terbaik.`,
        openGraph: {
            title: product.name,
            description: product.description?.replace(/<[^>]*>/g, '').substring(0, 160),
            images: [product.image_url || '/logo.png'],
            type: 'website',
        }
    }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
    const { id } = await params
    const product = await getProductById(id)

    if (!product) {
        return notFound()
    }

    // JSON-LD Structured Data for Product
    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.image_url,
        description: product.description?.replace(/<[^>]*>/g, ''),
        sku: `NL-${product.id.substring(0, 8)}`,
        offers: {
            '@type': 'Offer',
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/products/${product.id}`,
            priceCurrency: 'IDR',
            price: product.price_range?.split('-')[0].replace(/[^0-9]/g, '') || '0',
            availability: 'https://schema.org/InStock',
        }
    }

    const getStoreColor = (store: string) => {
        const s = store.toLowerCase()
        if (s.includes('shopee')) return 'bg-[#EE4D2D] hover:bg-[#d73211]'
        if (s.includes('tiktok')) return 'bg-black hover:bg-gray-800'
        if (s.includes('tokopedia')) return 'bg-[#03AC0E] hover:bg-[#028b0b]'
        if (s.includes('lazada')) return 'bg-[#101452] hover:bg-[#0a0d35]'
        if (s.includes('whatsapp')) return 'bg-[#25D366] hover:bg-[#128C7E]'
        return 'bg-[#990000] hover:bg-black'
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-32">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />

            {/* Breadcrumb Header */}
            <div className="bg-white border-b border-gray-100 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Breadcrumbs items={[
                        { label: 'Katalog', href: '/products' },
                        { label: product.name }
                    ]} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                <div className="bg-white p-4 md:p-8 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

                        {/* Left: Product Visuals (Larger - 7 cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="relative aspect-square w-full bg-gray-50 overflow-hidden border border-gray-100 group shadow-lg">
                                {product.image_url ? (
                                    <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-contain group-hover:scale-110 transition-transform duration-1000"
                                        unoptimized
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Package className="w-24 h-24 text-gray-200" />
                                    </div>
                                )}

                                {/* Status Overlay */}
                                <div className="absolute top-6 left-6 flex flex-col gap-2">
                                    <div className="bg-[#990000] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest italic">
                                        Verified Choice
                                    </div>
                                    <div className="bg-white/90 backdrop-blur-md text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest border border-black/5">
                                        Limited Stock
                                    </div>
                                </div>
                            </div>

                            {/* Trust Indicators */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-[#990000]" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Jaminan</p>
                                        <p className="text-xs font-bold text-gray-800">100% Original</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                        <Truck className="w-6 h-6 text-[#990000]" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Logistik</p>
                                        <p className="text-xs font-bold text-gray-800">Cepat & Aman</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Product Detail Info (Smaller - 5 cols) */}
                        <div className="lg:col-span-5 flex flex-col">
                            <div className="space-y-6 flex-1">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">(4.9/5.0) | Terjual 1rb+</span>
                                    </div>

                                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight break-words">
                                        {product.name}
                                    </h1>

                                    <div className="flex items-center gap-4">
                                        <div className="h-6 w-1 bg-[#990000] rounded-full" />
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">SKU: NL-{product.id.substring(0, 6)}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-8 py-6 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Harga Terbaik Hari Ini:</p>
                                        <div className="text-4xl font-black text-[#990000] tracking-tighter">
                                            {formatRupiah(product.price_range)}
                                        </div>
                                    </div>
                                    <div className="hidden sm:block">
                                        <div className="bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Harga Sudah Termasuk Promo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-1 bg-[#990000] rounded-full" />
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Deskripsi & Spesifikasi</h3>
                                    </div>

                                    <div
                                        className="prose prose-sm prose-slate max-w-none prose-p:text-gray-600 prose-p:leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: product.description || 'Pilihan produk terbaik yang telah melewati proses kurasi tim Editorial Newslan.id untuk menjamin kualitas bagi pelanggan kami.' }}
                                    />
                                </div>
                            </div>

                            {/* Purchase Options Container - Simplified */}
                            <div className="mt-12 space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900">Dapatkan Sekarang</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Pilih marketplace resmi Newslan network di bawah ini</p>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    {product.affiliate_links && product.affiliate_links.length > 0 ? (
                                        product.affiliate_links.map((link: any) => (
                                            <Link
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                className={`${getStoreColor(link.store_name)} flex-1 min-w-[200px] px-8 py-5 rounded-2xl flex items-center justify-between group transition-all transform hover:scale-[1.02] shadow-xl shadow-black/5 text-white animate-in fade-in slide-in-from-bottom-2`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                                        <ShoppingCart className="w-5 h-5" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none mb-1">Beli di</p>
                                                        <p className="text-xl font-black tracking-tighter leading-none">{link.store_name}</p>
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="w-full bg-gray-100 border border-gray-200 px-8 py-6 rounded-3xl text-gray-400 font-bold uppercase tracking-widest text-xs text-center border-dashed">
                                            Link Pembelian Belum Tersedia
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-[#990000]" />
                                    <span>Verified Affiliate</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-[#990000]" />
                                    <span>Official Warranty</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-[#990000]" />
                                    <span>Trusted Seller</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                <Suspense fallback={
                    <div className="mt-20 py-20 text-center text-gray-300">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Menemukan Rekomendasi Terkait...</p>
                    </div>
                }>
                    <TrendingProductsContainer currentProductId={product.id} />
                </Suspense>
            </div>

            {/* Mobile Bottom Sticky Action - Balanced with BottomNav */}
            <div className="md:hidden fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-7xl bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 z-40 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-2">
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 truncate">Harga Terbaik</span>
                    <span className="text-lg sm:text-xl font-black text-[#990000] tracking-tighter leading-none truncate">
                        {formatRupiah(product.price_range)}
                    </span>
                </div>
                {product.affiliate_links?.[0] && (
                    <Link
                        href={product.affiliate_links[0].url}
                        target="_blank"
                        className={`${getStoreColor(product.affiliate_links[0].store_name)} shrink-0 px-5 py-3 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-black/5 flex items-center gap-2 active:scale-95 transition-transform`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Beli di {product.affiliate_links[0].store_name.split(' ')[0]}</span>
                    </Link>
                )}
            </div>
        </div>
    )
}
