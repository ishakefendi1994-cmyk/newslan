'use client'

import Image from 'next/image'
import { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

export default function CompanyProfilePage() {
    const [selectedImage, setSelectedImage] = useState<{ src: string, alt: string } | null>(null)

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
            {/* Image Box Modal (Lightbox) */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 transition-all duration-300 animate-in fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white hover:text-primary transition-colors bg-white/10 p-3 rounded-full z-[1000] border border-white/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
                    >
                        <X size={32} />
                    </button>

                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="relative w-full h-full max-w-5xl max-h-[85vh] shadow-2xl">
                            <Image
                                src={selectedImage.src}
                                alt={selectedImage.alt}
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                        <div className="mt-6 bg-primary px-6 py-2 shadow-xl border border-white/10">
                            <p className="text-white font-black uppercase tracking-[0.4em] text-[10px] italic">{selectedImage.alt}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[400px] bg-slate-900 overflow-hidden flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10"></div>
                {/* Background Pattern/Overlay */}
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

            {/* Identity Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-30 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Company Info Card */}
                    <div className="lg:col-span-2 bg-white p-12 shadow-2xl border-t-8 border-primary space-y-12">
                        <section>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-8 border-b border-gray-100 pb-4">
                                Identitas <span className="text-primary font-light">Perusahaan</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 gap-y-6">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nama Perusahaan</p>
                                            <p className="font-bold text-gray-900 uppercase">PT. LINTAS AKTUAL NUSANTARA</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Contact Person</p>
                                            <p className="font-bold text-gray-900 underline decoration-primary decoration-2 text-lg">0823 7886 5775</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Head Office & Alamat</p>
                                            <p className="font-medium text-gray-600 leading-relaxed uppercase text-sm">
                                                Jl. Lintas Sumatera Km. 27 Dusun Talang Lindung RT.8 RW.4 Desa Muara Belengo <br />
                                                Kecamatan Pamenang Kabupaten Merangin Prov. jambi Kode Pos 37352
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email Resmi</p>
                                            <p className="font-bold text-gray-900 italic">ptlintasaktualnusantara@gmail.com</p>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className="relative h-64 md:h-auto bg-gray-100 border border-gray-200 group overflow-hidden cursor-zoom-in"
                                    onClick={() => setSelectedImage({ src: '/company/identitas-perusahaan.jpg', alt: 'Dokumentasi Identitas Perusahaan' })}
                                >
                                    <Image
                                        src="/company/identitas-perusahaan.jpg"
                                        alt="Identitas Perusahaan"
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                                            <ZoomIn className="text-primary" size={24} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-[8px] px-2 py-1 uppercase font-bold tracking-widest">Dokumentasi Kantor</div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-gray-50 -mx-12 px-12 py-12 border-y border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                                <div className="md:col-span-7 prose prose-lg max-w-none text-gray-600">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6 mt-0">
                                        Profil <span className="text-primary font-light">Media</span>
                                    </h2>
                                    <p>
                                        Sebagai media cetak, online, dan TV yang lahir di Kabupaten Merangin Provinsi Jambi,
                                        <strong> PT. LINTAS AKTUAL NUSANTARA</strong> (Newslan.id, Newslan TV, Newslan Tabloid)
                                        kini menjadi referensi utama informasi, edukasi, dan investigasi yang dipercaya oleh masyarakat.
                                    </p>
                                    <p>
                                        Dengan komitmen menyajikan fakta dan peristiwa di balik dinamika sosial, politik, serta pemerintahan lokal hingga global,
                                        kami telah memiliki perwakilan dan biro serta pembaca setia di seluruh Indonesia.
                                    </p>
                                </div>
                                <div
                                    className="md:col-span-5 relative h-80 border-4 border-white shadow-xl rotate-1 group overflow-hidden cursor-zoom-in"
                                    onClick={() => setSelectedImage({ src: '/company/profile-cover.jpg', alt: 'Visual Profil Perusahaan' })}
                                >
                                    <Image
                                        src="/company/profile-cover.jpg"
                                        alt="Profile Cover"
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                                            <ZoomIn className="text-primary" size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-8">
                                Legalitas <span className="text-primary font-light">Hukum</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {legalDocuments.map((doc, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div
                                            className="relative h-[480px] bg-gray-100 border border-gray-200 overflow-hidden shadow-sm group cursor-zoom-in"
                                            onClick={() => setSelectedImage({ src: doc.src, alt: doc.title })}
                                        >
                                            <Image
                                                src={doc.src}
                                                alt={doc.title}
                                                fill
                                                className="object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
                                                unoptimized
                                            />
                                            <div className="absolute top-4 left-4 bg-primary text-white text-[10px] px-3 py-1 font-black uppercase italic z-10">
                                                DOKUMEN RESMI
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                                                <div className="bg-white text-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl flex items-center space-x-2">
                                                    <ZoomIn size={14} />
                                                    <span>Lihat Versi Full</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 border-l-4 border-primary bg-gray-50">
                                            <h3 className="text-sm font-black uppercase text-black mb-1 tracking-tight">{doc.title}</h3>
                                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-wider">{doc.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Stats/CTA */}
                    <div className="space-y-8">
                        <div className="bg-black p-10 text-white space-y-8">
                            <div>
                                <h3 className="text-primary font-black uppercase tracking-widest text-[10px] mb-4">Visi Kami</h3>
                                <p className="text-sm text-gray-400 leading-relaxed italic border-l border-primary/30 pl-4">
                                    "Menjadi sarana efektif dalam mensosialisasikan program-program instansi pemerintah, swasta, maupun perseorangan,
                                    untuk mendukung penyebaran informasi dan sosialisasi yang objektif."
                                </p>
                            </div>
                            <div className="h-[1px] bg-gray-800"></div>
                            <div>
                                <h3 className="text-primary font-black uppercase tracking-widest text-[10px] mb-4">Platform Media</h3>
                                <ul className="space-y-3 text-xs font-black uppercase tracking-widest">
                                    <li className="flex items-center space-x-3 group">
                                        <span className="w-2 h-2 bg-primary group-hover:scale-150 transition-transform"></span>
                                        <span className="text-gray-300 group-hover:text-white transition-colors">Newslan.id (Online)</span>
                                    </li>
                                    <li className="flex items-center space-x-3 group">
                                        <span className="w-2 h-2 bg-primary group-hover:scale-150 transition-transform"></span>
                                        <span className="text-gray-300 group-hover:text-white transition-colors">Newslan TV (Digital)</span>
                                    </li>
                                    <li className="flex items-center space-x-3 group">
                                        <span className="w-2 h-2 bg-primary group-hover:scale-150 transition-transform"></span>
                                        <span className="text-gray-300 group-hover:text-white transition-colors">Newslan Tabloid (Print)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-primary p-1 text-center font-black uppercase italic text-white text-[10px] tracking-[0.3em] flex items-center justify-center space-x-2">
                            <span className="w-1 h-1 bg-white rounded-full"></span>
                            <span>Trusted News Media</span>
                            <span className="w-1 h-1 bg-white rounded-full"></span>
                        </div>
                    </div>
                </div>
            </div>

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
