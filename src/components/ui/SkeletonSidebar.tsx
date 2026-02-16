export default function SkeletonSidebar() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="skeleton w-1.5 h-6 rounded" />
                    <div className="skeleton w-48 h-6 rounded" />
                </div>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-row items-start gap-3 py-3 border-b border-gray-100">
                        <div className="skeleton relative w-20 h-20 shrink-0 rounded" />
                        <div className="flex-1 space-y-2">
                            <div className="skeleton w-full h-4 rounded" />
                            <div className="skeleton w-4/5 h-4 rounded" />
                            <div className="skeleton w-3/5 h-4 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Ad Placeholder */}
            <div className="skeleton w-full h-64 rounded-xl" />
        </div>
    )
}
