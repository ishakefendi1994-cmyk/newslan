import { getTrendingProducts } from '@/lib/data'
import { ShopeeProductCard } from './ShopeeProductCard'
import { Star } from 'lucide-react'

export default async function TrendingProductsContainer({ currentProductId }: { currentProductId?: string }) {
    const products = await getTrendingProducts(8)

    // Filter out current product
    const filteredProducts = products?.filter(p => p.id !== currentProductId).slice(0, 4) || []

    if (filteredProducts.length === 0) return null

    return (
        <div className="mt-20 space-y-8">
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-none flex items-center justify-center -rotate-3 shadow-lg">
                        <Star className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="w-12 h-[2px] bg-primary"></div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Trending <span className="text-primary text-stroke-thin">Offers</span></h2>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pilihan Terbaik Minggu Ini di Newslan.id</p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Verified Collection</span>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {filteredProducts.map((product) => (
                    <ShopeeProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        image={product.image_url}
                        priceRange={product.price_range}
                        storeNames={product.affiliate_links?.map((l: any) => l.store_name)}
                    />
                ))}
            </div>
        </div>
    )
}
