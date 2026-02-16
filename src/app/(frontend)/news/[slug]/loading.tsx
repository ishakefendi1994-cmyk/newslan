import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Memuat Berita...</p>
        </div>
    )
}
