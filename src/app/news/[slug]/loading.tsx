export default function Loading() {
    return (
        <div className="bg-white min-h-screen animate-pulse">
            {/* Breadcrumb Skeleton */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="h-4 bg-gray-200 rounded w-32" />
            </div>

            {/* Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">

                {/* Hero Skeleton (Split Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px] mb-12 border border-gray-200">
                    <div className="bg-gray-200 w-full h-full" />
                    <div className="bg-gray-100 p-8 md:p-12 flex flex-col justify-between">
                        <div className="h-4 bg-gray-300 w-24 mb-8" />
                        <div className="space-y-4">
                            <div className="h-10 bg-gray-300 w-full" />
                            <div className="h-10 bg-gray-300 w-3/4" />
                        </div>
                        <div className="h-4 bg-gray-300 w-48 mt-8" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Skeleton */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 w-full" />
                            <div className="h-4 bg-gray-200 w-full" />
                            <div className="h-4 bg-gray-200 w-5/6" />
                            <div className="h-4 bg-gray-200 w-full" />
                        </div>
                        <div className="h-64 bg-gray-200 rounded w-full my-8" />
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 w-full" />
                            <div className="h-4 bg-gray-200 w-full" />
                            <div className="h-4 bg-gray-200 w-4/6" />
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="lg:col-span-5 lg:pl-10 space-y-10">
                        <div className="h-8 bg-gray-200 w-40 mb-6" />
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-24 h-24 bg-gray-200 flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 w-3/4" />
                                    <div className="h-3 bg-gray-200 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
