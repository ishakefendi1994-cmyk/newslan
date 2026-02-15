export default function Loading() {
    return (
        <div className="min-h-screen bg-white animate-pulse">
            {/* Navbar Skeleton */}
            <div className="h-16 border-b border-black bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-md" />
                        <div className="w-40 h-8 bg-gray-200 rounded-md" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* News Ticker */}
                <div className="h-10 bg-gray-100 rounded w-full" />

                {/* Banner */}
                <div className="h-[400px] bg-gray-200 rounded-lg w-full" />

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-4">
                        <div className="h-64 bg-gray-100 rounded-lg" />
                        <div className="h-64 bg-gray-100 rounded-lg" />
                    </div>
                    <div className="lg:col-span-4 space-y-4">
                        <div className="h-96 bg-gray-100 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    )
}
