'use client'

import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, subDays, addDays, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

interface Category {
    id: string
    name: string
    slug: string
}

interface IndeksHeaderProps {
    categories: Category[]
}

export default function IndeksHeader({ categories }: IndeksHeaderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentDateStr = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')
    const currentCategoryId = searchParams.get('category') || 'all'

    const currentDate = parseISO(currentDateStr)

    const updateFilters = (newDate?: string, newCategory?: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (newDate) params.set('date', newDate)
        if (newCategory) params.set('category', newCategory)
        router.push(`/indeks?${params.toString()}`)
    }

    const nextDay = format(addDays(currentDate, 1), 'yyyy-MM-dd')
    const prevDay = format(subDays(currentDate, 1), 'yyyy-MM-dd')

    return (
        <div className="bg-white border-b border-gray-100 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Date Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-10">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-[#0047ba]">
                            Indeks <span className="text-gray-900">Berita</span>
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                            Arsip Berita Harian {format(currentDate, 'EEEE, d MMMM yyyy', { locale: id })}
                        </p>
                    </div>

                    <div className="flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-sm">
                        <button
                            onClick={() => updateFilters(prevDay)}
                            className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-500 hover:text-[#0047ba]"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center px-6 py-2 gap-3 border-x border-gray-200">
                            <Calendar className="w-4 h-4 text-[#0047ba]" />
                            <input
                                type="date"
                                value={currentDateStr}
                                onChange={(e) => updateFilters(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-black uppercase tracking-tight cursor-pointer"
                            />
                        </div>

                        <button
                            onClick={() => updateFilters(nextDay)}
                            className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-500 hover:text-[#0047ba]"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <div className="flex items-center gap-2 bg-[#0047ba]/5 px-4 py-2 rounded-full border border-[#0047ba]/10 text-[#0047ba] shrink-0">
                        <Filter className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase">Kategori:</span>
                    </div>

                    <button
                        onClick={() => updateFilters(undefined, 'all')}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${currentCategoryId === 'all'
                                ? 'bg-[#0047ba] text-white border-[#0047ba] shadow-lg shadow-[#0047ba]/20'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#0047ba] hover:text-[#0047ba]'
                            }`}
                    >
                        Semua Kategori
                    </button>

                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => updateFilters(undefined, cat.id)}
                            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-tight transition-all border whitespace-nowrap ${currentCategoryId === cat.id
                                    ? 'bg-[#0047ba] text-white border-[#0047ba] shadow-lg shadow-[#0047ba]/20'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#0047ba] hover:text-[#0047ba]'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
