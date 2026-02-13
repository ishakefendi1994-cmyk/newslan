import { Shield, Users, MapPin, Briefcase, Info, AlertTriangle, Scale, Target } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function RedaksiPage() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Header */}
            <div className="bg-black text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-4">
                    <Badge className="bg-primary/20 text-primary border-none uppercase tracking-widest px-4 py-1">Editorial Board</Badge>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase">REDAKSI <span className="text-primary italic">NEWSLAN.ID</span></h1>
                    <p className="text-gray-400 text-lg">Edukasi, Investigasi dan Terpercaya</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">

                {/* Company Info Card */}
                <section className="bg-gray-50 p-8 md:p-12 border-l-8 border-black shadow-sm grid grid-cols-1 md:col-span-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Profil Perusahaan</h2>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                MEDIA CETAK, ONLINE & TV – ONLINE NEWSLAN.ID merupakan wadah jurnalis profesional yang berkomitmen menjaga keutuhan NKRI dan memberikan informasi terpercaya.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm">
                            <div className="flex items-start space-x-3">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <p className="font-bold">Alamat</p>
                                    <p className="text-gray-500">JALAN LINTAS SUMATERA KM 27 DUSUN TALANG LINDUNG RT 08 RW 04 DESA MUARA BELENGO KECAMATAN PAMENANG KABUPATEN MERANGIN PROVINSI JAMBI, 37352</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Briefcase className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <p className="font-bold">Diterbitkan Oleh</p>
                                    <p className="text-gray-500 font-medium">PT. LINTAS AKTUAL NUSANTARA</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase">NIB: 1512210023587 • AHU-0076668.AH.01.01.TAHUN 2021</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-inner space-y-4">
                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Legalitas & Keuangan</h3>
                        <div className="space-y-4">
                            <div className="pb-4 border-b border-gray-50">
                                <p className="text-[10px] text-gray-400 uppercase font-black">Notaris PPAT</p>
                                <p className="text-sm font-bold uppercase">ASWANTO , SH, M.Kn</p>
                                <p className="text-[10px] text-gray-500">Akta No. 38 Tanggal 30 November 2021</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black">Rekening Perusahaan</p>
                                <p className="text-lg font-black text-black">2027819049</p>
                                <p className="text-xs font-bold text-gray-500 uppercase">BNI AN. PT LINTAS AKTUAL NUSANTARA</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Management Structure */}
                <section className="space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Struktur Organisasi</h2>
                        <div className="h-1 w-20 bg-primary mx-auto" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* High Level */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b-2 border-primary/10 pb-2">Pendiri & Pembina</h3>
                            <div className="space-y-4">
                                <RoleGroup title="Pendiri" names={["SUKARLAN", "AGUSTIN IDA ERNIWATI"]} />
                                <RoleGroup title="Dewan Pembina" names={["JENDERAL ANDIKA PERKASA, S.E., M.A., M.SC., M.PHIL, PH.D"]} />
                                <RoleGroup title="Dewan Penasehat" names={["H. AL HARIS", "GANJAR PRANOWO", "KOMBES IRWAN ANDY PURNAMAWAN", "KOLONEL INF TOMI RADYA DIANSYAH LUBIS", "KURNIADI HIDAYAT", "TONI IRWAN JAYA"]} />
                            </div>
                        </div>

                        {/* Executives */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b-2 border-primary/10 pb-2">Manajemen Inti</h3>
                            <div className="space-y-4">
                                <RoleGroup title="Direktur" names={["AGUSTIN IDA ERNAWATI"]} />
                                <RoleGroup title="Komisaris" names={["SUKARLAN"]} />
                                <RoleGroup title="Pimpinan Redaksi / PJ" names={["SUKARLAN"]} variant="highlight" />
                                <RoleGroup title="Wakil Pimpinan Redaksi" names={["JULIFAN PERDANA"]} />
                                <RoleGroup title="Pimpinan Perusahaan" names={["AGUSTIN IDA ERNAWATI"]} />
                            </div>
                        </div>

                        {/* Support */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b-2 border-primary/10 pb-2">Divisi & Staff</h3>
                            <div className="space-y-4">
                                <RoleGroup title="Manager HRD" names={["JULIFAN PERDANA"]} />
                                <RoleGroup title="Manager Keuangan" names={["ABELLA NISHA FEBRIANA"]} />
                                <RoleGroup title="Manager Marketing" names={["MUJIONO"]} />
                                <RoleGroup title="Humas / SDM" names={["HARYONO"]} />
                                <RoleGroup title="Tim IT & Desain" names={["FAJAR PAMBUDI", "TOYIB", "DODI WICAKSONO", "RIKI HIDAYAT"]} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Network & Reporters */}
                <section className="bg-black text-white p-8 md:p-16 space-y-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 opacity-10">
                        <Users size={400} />
                    </div>

                    <div className="relative z-10 space-y-2">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Jaringan Koresponden</h2>
                        <p className="text-gray-400">Liputan Nasional & Daerah</p>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <RegionGroup title="Kaperwil & Korwil" list={[
                            "Korwil Pekanbaru: SUTONO",
                            "Korwil Sumatera: SUKARNO",
                            "Korwil Jateng/DIY: MUJIBURAHMAN",
                            "Kaperwil Jambi: MUSYARIF",
                            "Kaperwil Sumsel: YATIYO"
                        ]} />
                        <RegionGroup title="Kepala Biro (Kabiro)" list={[
                            "Kabiro Merangin: PANCA PUTRA SITOMPUL",
                            "Kabiro Sarolangun: HARYONO",
                            "Kabiro Batanghari: ENDANG SUSILO",
                            "Kabiro Semarang Raya: KHRISNA",
                            "Kabiro Pati: SUKARTO",
                            "Kabiro Solo: ANDRI W",
                            "Kabiro Lampung Selatan: ARDIYANTO",
                            "Kabiro Lahat: UJANG MERIANSYAH",
                            "Kabiro Kota Padang: ASRI HIDAYAT",
                            "Kabiro Bogor: SAEFUL ANUARY",
                            "Kabiro Banyuwangi: AGUS HARIANTO",
                            "Kabiro Karang Asem: I GEDE SUPARTA",
                            "Kabiro Tanggamus: HERRY ANGKASA",
                            "Kabiro Majalengka: AGUS",
                            "Kabiro Lampung Timur: SELAMET",
                            "Kabiro Muko Muko: MUSYARIF",
                            "Kabiro Sukabumi: SAPTA HENDRA W",
                            "Kabiro Payakumbuh: RIKI HIDAYAT",
                            "Kabiro Muratara: EDIYANTO",
                            "Kabiro Kota Bitung: ERVAN DAUD",
                            "Kabiro Blitar: SODIKIN",
                            "Kabiro Solok Selatan: ADHI ZAKARIA",
                            "Kabiro Palembang: DHIKA PUTRA UTAMA",
                            "Kabiro Kota Jambi: RAHMAD ADE SUBRATA",
                            "Kabiro Muaro Jambi: JOKO SURONO",
                            "Kabiro Solok: RUBIYANTO"
                        ]} />
                        <RegionGroup title="Tim Hukum" list={[
                            "M. ALEX ALNEMERI, S.H, MH",
                            "ESSERA GULO, SH",
                            "RAMIYEM SH",
                            "AHMAD JONI SH",
                            "DEDE RISKADINATA, S.H"
                        ]} />
                    </div>
                </section>

                {/* Visi Misi */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-gray-100">
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3 text-primary">
                            <Target className="w-8 h-8 font-black" />
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Visi Kami</h2>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Menjadikan wadah Newslan.id sebuah 'Keluarga Besar' Saling Membantu, Melengkapi dan Menjaga.",
                                "Menjadikan Wadah Newslan.id Sebagai Jaringan dalam membangun kebersamaan dan kekeluargaan.",
                                "Menjadikan anggota jurnalis sejahtera secara mandiri, berakhlak dan bermartabat.",
                                "Menjadikan Jurnalis media massa yang profesional dan terpercaya."
                            ].map((item, i) => (
                                <li key={i} className="flex items-start space-x-3 group">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                                    <p className="text-gray-600 font-medium text-sm leading-relaxed">{item}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center space-x-3 text-primary">
                            <Shield className="w-8 h-8 font-black" />
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Misi Kami</h2>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Melahirkan jurnalis yang profesional sesuai UU Pers No. 40 Tahun 1999.",
                                "Membangun soliditas dan kebersamaan sesama anggota.",
                                "Menjadikan anggota aktif dalam pemberitaan.",
                                "Mengembangkan potensi minat dan bakat kejurnalistikan.",
                                "Menginformasikan dan sosialisasi program pemerintah."
                            ].map((item, i) => (
                                <li key={i} className="flex items-start space-x-3 group">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                                    <p className="text-gray-600 font-medium text-sm leading-relaxed">{item}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Warning & Contact */}
                <section className="bg-red-50 border-t-8 border-primary p-8 md:p-12 space-y-8">
                    <div className="flex items-center space-x-3 text-red-600">
                        <AlertTriangle className="w-8 h-8 animate-pulse" />
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Himbauan Penting</h2>
                    </div>
                    <p className="text-red-900/70 font-medium leading-relaxed italic">
                        "Harap tidak melayani oknum yang mengatasnamakan Media NEWSLAN.ID yang tidak tercantum dalam box redaksi ini. Setiap jurnalis kami wajib dilengkapi KTA, Kartu Pers, dan Surat Tugas resmi. Laporkan segala bentuk pelanggaran ke pihak berwajib atau redaksi."
                    </p>
                    <div className="pt-6 border-t border-red-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-red-600">Hubungi Kami</p>
                            <p className="text-sm font-bold text-red-900">0811-7248-008 / 0822-8708-2434</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}

function RoleGroup({ title, names, variant = 'default' }: { title: string, names: string[], variant?: 'default' | 'highlight' }) {
    return (
        <div className={`p-4 rounded-2xl transition-all ${variant === 'highlight' ? 'bg-primary/5 border border-primary/20 scale-105' : 'bg-gray-50'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
            <div className="space-y-1">
                {names.map((name, i) => (
                    <p key={i} className={`text-sm font-black ${variant === 'highlight' ? 'text-black' : 'text-gray-800'}`}>{name}</p>
                ))}
            </div>
        </div>
    )
}

function RegionGroup({ title, list }: { title: string, list: string[] }) {
    return (
        <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary">{title}</h4>
            <ul className="space-y-2">
                {list.map((item, i) => (
                    <li key={i} className="text-[11px] font-medium text-gray-400 leading-tight pb-2 border-b border-white/5 last:border-none">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}
