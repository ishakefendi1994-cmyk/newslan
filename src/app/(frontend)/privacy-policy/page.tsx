import { getSiteSettings } from "@/lib/settings";

export default async function PrivacyPolicyPage() {
    const settings = await getSiteSettings();
    const siteName = settings.site_name;
    const sections = [
        { id: 'pendahuluan', title: '1. Pendahuluan' },
        { id: 'data-dikumpulkan', title: '2. Data yang Kami Kumpulkan' },
        { id: 'penggunaan-info', title: '3. Penggunaan Informasi' },
        { id: 'keamanan-data', title: '4. Keamanan Data' },
        { id: 'hak-pengguna', title: '5. Hak Pengguna' },
        { id: 'kebijakan-cookie', title: '6. Kebijakan Cookie' },
        { id: 'perubahan-kebijakan', title: '7. Perubahan Kebijakan' },
        { id: 'kontak', title: '8. Kontak Kami' },
    ]

    return (
        <div className="bg-white min-h-screen">
            {/* Header Section */}
            <div className="bg-gray-50 border-b border-gray-100 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-[10px] mb-4">
                            <div className="w-8 h-[2px] bg-primary"></div>
                            <span>Legal & Editorial</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none mb-6">
                            Kebijakan <span className="text-primary text-stroke-thin">Privasi</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">Terakhir diperbarui: 14 Februari 2026</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Sidebar Navigation */}
                    <div className="hidden lg:block lg:col-span-4">
                        <div className="sticky top-32 space-y-8">
                            <div className="border-l-4 border-black pl-6 py-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-black">Daftar Isi</h3>
                            </div>
                            <nav className="flex flex-col space-y-4">
                                {sections.map((section) => (
                                    <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
                                    >
                                        {section.title}
                                    </a>
                                ))}
                            </nav>

                            <div className="bg-primary/5 p-8 border border-primary/10 space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Butuh Bantuan?</p>
                                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                    Jika Anda memiliki pertanyaan mengenai privasi Anda, jangan ragu untuk menghubungi tim legal kami.
                                </p>
                                <a href={`mailto:redaksi@${siteName.toLowerCase()}`} className="inline-block text-xs font-black uppercase tracking-widest text-black border-b-2 border-primary hover:text-primary transition-colors pb-1">
                                    Email Redaksi &rarr;
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <article className="prose prose-lg max-w-none prose-headings:text-black prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-black">

                            <section id="pendahuluan" className="scroll-mt-32">
                                <h2>1. Pendahuluan</h2>
                                <p>
                                    Selamat datang di <strong>{siteName.toUpperCase()}</strong>. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat Anda mengakses situs web kami.
                                </p>
                                <p>
                                    Dengan menggunakan layanan {siteName.toUpperCase()}, Anda menyetujui praktik data yang dijelaskan dalam pernyataan ini sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) yang berlaku di Republik Indonesia.
                                </p>
                            </section>

                            <section id="data-dikumpulkan" className="scroll-mt-32 mt-16">
                                <h2>2. Data yang Kami Kumpulkan</h2>
                                <p>Kami mengumpulkan beberapa jenis informasi dari dan tentang pengguna kami, termasuk:</p>
                                <ul>
                                    <li><strong>Informasi Identitas Pribadi:</strong> Nama, alamat email, dan nomor telepon yang Anda berikan secara sukarela saat mendaftar akun atau berlangganan newsletter.</li>
                                    <li><strong>Data Teknis:</strong> Alamat IP, jenis perangkat, sistem operasi, dan data browser umum yang kami kumpulkan secara otomatis melalui cookie dan teknologi pelacakan lainnya.</li>
                                    <li><strong>Data Interaksi:</strong> Informasi tentang bagaimana Anda menggunakan situs kami, termasuk artikel yang dibaca, waktu kunjungan, dan interaksi dengan fitur-fitur kami.</li>
                                </ul>
                            </section>

                            <section id="penggunaan-info" className="scroll-mt-32 mt-16">
                                <h2>3. Penggunaan Informasi</h2>
                                <p>Informasi yang kami kumpulkan digunakan untuk tujuan berikut:</p>
                                <ul>
                                    <li>Menyediakan, mengoperasikan, dan memelihara situs web NEWSLAN.ID.</li>
                                    <li>Meningkatkan, mempersonalisasi, dan memperluas konten berita agar lebih relevan bagi Anda.</li>
                                    <li>Memahami dan menganalisis bagaimana Anda menggunakan layanan kami untuk pengembangan fitur baru.</li>
                                    <li>Mengirimkan informasi berlangganan, update berita penting, atau komunikasi administratif.</li>
                                    <li>Mencegah aktivitas penipuan dan meningkatkan keamanan teknis situs.</li>
                                </ul>
                            </section>

                            <section id="keamanan-data" className="scroll-mt-32 mt-16">
                                <h2>4. Keamanan Data</h2>
                                <p>
                                    Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang standar industri untuk melindungi data pribadi Anda dari akses yang tidak sah, pengungkapan, perubahan, atau penghancuran.
                                </p>
                                <p>
                                    Namun, harap diingat bahwa tidak ada metode transmisi data melalui internet yang 100% aman. Meskipun kami berusaha keras untuk melindungi informasi pribadi Anda, kami tidak dapat menjamin keamanan mutlaknya.
                                </p>
                            </section>

                            <section id="hak-pengguna" className="scroll-mt-32 mt-16">
                                <h2>5. Hak Pengguna</h2>
                                <p>Sesuai dengan regulasi yang berlaku, Anda memiliki hak untuk:</p>
                                <ul>
                                    <li>Mengakses data pribadi yang kami simpan tentang Anda.</li>
                                    <li>Meminta koreksi atau pembaharuan atas data yang tidak akurat.</li>
                                    <li>Meminta penghapusan data pribadi Anda dari sistem kami (Hak untuk Dilupakan).</li>
                                    <li>Menarik persetujuan Anda kapan saja untuk penggunaan data tertentu (seperti pemasaran/newsletter).</li>
                                </ul>
                            </section>

                            <section id="kebijakan-cookie" className="scroll-mt-32 mt-16">
                                <h2>6. Kebijakan Cookie</h2>
                                <p>
                                    {siteName.toUpperCase()} menggunakan cookie untuk meningkatkan pengalaman navigasi Anda. Cookie adalah file kecil yang disimpan di perangkat Anda saat Anda mengunjungi situs kami. Kami menggunakan cookie fungsional untuk mengingat preferensi Anda dan cookie analitik untuk memantau performa situs.
                                </p>
                                <p>
                                    Anda dapat mengatur browser Anda untuk menolak cookie, namun hal ini mungkin akan mempengaruhi fungsi tertentu dari situs web kami.
                                </p>
                            </section>

                            <section id="perubahan-kebijakan" className="scroll-mt-32 mt-16">
                                <h2>7. Perubahan Kebijakan</h2>
                                <p>
                                    {siteName.toUpperCase()} dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Setiap perubahan akan kami umumkan dengan memperbarui "Tanggal Terakhir Diperbarui" di bagian atas halaman ini. Kami menyarankan Anda untuk meninjau halaman ini secara berkala.
                                </p>
                            </section>

                            <section id="kontak" className="scroll-mt-32 mt-16 pb-20">
                                <h2>8. Kontak Kami</h2>
                                <p>
                                    Jika Anda memiliki pertanyaan mendalam atau keluhan mengenai kebijakan privasi ini, silakan hubungi kami melalui:
                                </p>
                                <div className="bg-gray-50 p-8 rounded-none border-l-4 border-primary">
                                    <p className="m-0 font-bold text-black">Redaksi {siteName.toUpperCase()}</p>
                                    <p className="m-0">Email: redaksi@{siteName.toLowerCase()}</p>
                                    <p className="m-0">WhatsApp: +62 823-7886-5775</p>
                                    <p className="m-0">Alamat: [Jalan Lintas Sumatera Km 27 Dusun Talang Lindung Rt 08 Rw 04 Desa Muara Belengo Kecamatan Pamenang Kabupaten Merangin Provinsi Jambi, 37352]</p>
                                </div>
                            </section>
                        </article>
                    </div>
                </div>
            </div>
        </div>
    )
}
