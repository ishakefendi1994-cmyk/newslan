import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalPages: number
    baseUrl: string
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    // Generate page numbers to show
    const getPageNumbers = () => {
        const delta = 2 // How many pages to show around current
        const range = []
        const rangeWithDots = []
        let l

        range.push(1)

        if (totalPages <= 1) return [1]

        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
            if (i < totalPages && i > 1) {
                range.push(i)
            }
        }

        range.push(totalPages)

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1)
                } else if (i - l !== 1) {
                    rangeWithDots.push('...')
                }
            }
            rangeWithDots.push(i)
            l = i
        }

        return rangeWithDots
    }

    const pages = getPageNumbers()

    if (totalPages <= 1) return null

    return (
        <div className="flex justify-center items-center space-x-2 mt-12 mb-8">
            {/* Previous Button */}
            {currentPage > 1 ? (
                <Link
                    href={`${baseUrl}?page=${currentPage - 1}`}
                    className="p-2 border border-black/10 hover:border-black/30 hover:bg-white transition-all rounded disabled:opacity-50"
                    aria-label="Previous Page"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
            ) : (
                <span className="p-2 border border-black/5 opacity-30 cursor-not-allowed rounded">
                    <ChevronLeft className="w-5 h-5" />
                </span>
            )}

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
                {pages.map((page, idx) => (
                    <div key={idx}>
                        {page === '...' ? (
                            <span className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                            <Link
                                href={`${baseUrl}?page=${page}`}
                                className={`px-4 py-2 text-sm font-black border transition-all rounded ${currentPage === page
                                        ? 'bg-black text-white border-black'
                                        : 'bg-transparent text-gray-600 border-transparent hover:border-black/10 hover:bg-white'
                                    }`}
                            >
                                {page}
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* Next Button */}
            {currentPage < totalPages ? (
                <Link
                    href={`${baseUrl}?page=${currentPage + 1}`}
                    className="p-2 border border-black/10 hover:border-black/30 hover:bg-white transition-all rounded"
                    aria-label="Next Page"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
            ) : (
                <span className="p-2 border border-black/5 opacity-30 cursor-not-allowed rounded">
                    <ChevronRight className="w-5 h-5" />
                </span>
            )}
        </div>
    )
}
