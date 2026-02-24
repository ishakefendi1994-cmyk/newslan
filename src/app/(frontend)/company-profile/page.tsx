import { getPageBySlug } from '@/lib/data'
import CompanyProfileClient from '@/components/company/CompanyProfileClient'

export default async function CompanyProfilePage() {
    const dbPage = await getPageBySlug('company-profile')

    // If page exists in database, render dynamic content
    if (dbPage && dbPage.content) {
        return (
            <div className="bg-white min-h-screen py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-10">
                        {dbPage.title}
                    </h1>
                    <article
                        className="prose prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-p:text-gray-600"
                        dangerouslySetInnerHTML={{ __html: dbPage.content }}
                    />
                </div>
            </div>
        )
    }

    // Default Fallback Design
    const legalDocuments = [
        {
            title: 'Akta Pendirian & Perubahan',
            description: 'Notaris & PPAT Aswanto, SH, M.Kn. Nomor Akta -38- Tanggal 30 November 2021.',
            src: '/company/akta-perusahaan.jpg'
        },
        {
            title: 'SK Kemenkumham',
            description: 'Pengesahan Pendirian Badan Hukum Perseroan Terbatas PT LINTAS AKTUAL NUSANTARA.',
            src: '/company/sk-kemenkumham.jpg'
        },
        {
            title: 'KTA Resmi Serikat Pers Republik Indonesia',
            description: 'Kartu Tanda Anggota resmi yang menandakan legalitas jurnalis di bawah naungan SPRI.',
            src: '/press.jpg'
        }
    ]

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[400px] bg-slate-900 overflow-hidden flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10"></div>
                <div className="absolute inset-0 opacity-20 z-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
                    <div className="max-w-3xl">
                        <div className="flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-[10px] mb-4">
                            <div className="w-8 h-[2px] bg-primary"></div>
                            <span>Corporate Profile</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] text-white mb-6">
                            PT. Lintas <br />
                            <span className="text-primary">Aktual</span> Nusantara
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed max-w-2xl border-l-2 border-primary/50 pl-6">
                            Penyaji fakta dan peristiwa di balik dinamika sosial, politik, serta pemerintahan lokal hingga global.
                        </p>
                    </div>
                </div>
            </div>

            <CompanyProfileClient legalDocuments={legalDocuments} />

            {/* Footer Attribution Section */}
            <div className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-primary w-12 h-12 flex items-center justify-center rounded-full shadow-lg">
                            <span className="text-white font-black italic">NL</span>
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-tight text-gray-900">NEWSLAN.ID Group</p>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Verified News Outlet</p>
                        </div>
                    </div>
                    <div className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] text-center md:text-right">
                        © 2026 PT. LINTAS AKTUAL NUSANTARA <br /> All Corporate Rights Reserved.
                    </div>
                </div>
            </div>
        </div>
    )
}
