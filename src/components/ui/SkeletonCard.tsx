export default function SkeletonCard({
    variant = 'compact'
}: {
    variant?: 'tempo-hero' | 'tempo-sub' | 'tempo-sidebar' | 'tempo-horizontal' | 'compact'
}) {

    // Tempo Hero Skeleton (Large dramatic hero)
    if (variant === 'tempo-hero') {
        return (
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                <div className="skeleton absolute inset-0" />
                <div className="absolute bottom-0 left-0 p-6 w-full space-y-3">
                    <div className="skeleton w-20 h-6 rounded" />
                    <div className="skeleton w-full h-8 rounded" />
                    <div className="skeleton w-4/5 h-8 rounded" />
                </div>
            </div>
        )
    }

    // Tempo Sub Skeleton (Medium 3-column cards)
    if (variant === 'tempo-sub') {
        return (
            <div className="flex flex-col space-y-4">
                <div className="skeleton relative aspect-[4/3] w-full rounded" />
                <div className="space-y-2">
                    <div className="skeleton w-16 h-5 rounded" />
                    <div className="skeleton w-full h-5 rounded" />
                    <div className="skeleton w-4/5 h-5 rounded" />
                </div>
            </div>
        )
    }

    // Tempo Sidebar Skeleton (Small horizontal)
    if (variant === 'tempo-sidebar') {
        return (
            <div className="flex flex-row items-start gap-3 py-3 border-b border-gray-100">
                <div className="skeleton relative w-20 h-20 shrink-0 rounded" />
                <div className="flex-1 space-y-2">
                    <div className="skeleton w-full h-4 rounded" />
                    <div className="skeleton w-4/5 h-4 rounded" />
                    <div className="skeleton w-3/5 h-4 rounded" />
                </div>
            </div>
        )
    }

    // Tempo Horizontal Skeleton (Full-width)
    if (variant === 'tempo-horizontal') {
        return (
            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-gray-200">
                <div className="skeleton relative w-full md:w-[30%] aspect-video rounded" />
                <div className="flex-1 space-y-3">
                    <div className="skeleton w-20 h-5 rounded" />
                    <div className="skeleton w-full h-6 rounded" />
                    <div className="skeleton w-4/5 h-6 rounded" />
                    <div className="skeleton w-full h-4 rounded" />
                    <div className="skeleton w-3/5 h-4 rounded" />
                </div>
            </div>
        )
    }

    // Compact Skeleton (Default)
    return (
        <div className="flex flex-col space-y-3">
            <div className="skeleton relative aspect-video w-full rounded" />
            <div className="space-y-2">
                <div className="skeleton w-16 h-4 rounded" />
                <div className="skeleton w-full h-4 rounded" />
                <div className="skeleton w-4/5 h-4 rounded" />
            </div>
        </div>
    )
}
