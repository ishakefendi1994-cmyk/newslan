export default function Loading() {
    return (
        <div className="bg-white min-h-screen pb-20 animate-pulse">
            {/* Category Header Skeleton */}
            <div className="bg-gray-50 border-b border-gray-100 py-12 md:py-20 mb-10">
                <div className="w-full px-4 sm:px-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-1.5 bg-gray-300 mb-2" />
                        <div className="h-10 md:h-16 bg-gray-300 w-1/2 rounded" />
                        <div className="h-4 bg-gray-200 w-64 rounded" />
                    </div>
                </div>
            </div>

            {/* Articles Grid Skeleton */}
            <div className="w-full px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-[4/3] bg-gray-200 w-full" />
                            <div className="h-4 bg-gray-200 w-1/3" />
                            <div className="h-6 bg-gray-200 w-full" />
                            <div className="h-4 bg-gray-200 w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
