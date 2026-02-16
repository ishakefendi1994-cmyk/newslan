export default function PedomanMediaSiberPage() {
    const sections = [
        { id: 'ruang-lingkup', title: '1. Ruang Lingkup' },
        { id: 'verifikasi', title: '2. Verifikasi & Keberimbangan' },
        { id: 'user-content', title: '3. Isi Buatan Pengguna' },
        { id: 'ralat-koreksi', title: '4. Ralat, Koreksi & Hak Jawab' },
        { id: 'pencabutan', title: '5. Pencabutan Berita' },
        { id: 'iklan', title: '6. Iklan & Komersial' },
        { id: 'hak-cipta', title: '7. Hak Cipta' },
        { id: 'tanggung-jawab', title: '8. Tanggung Jawab' },
    ]

    return (
        <div className="bg-white min-h-screen">
            {/* Header Section */}
            <div className="bg-gray-50 border-b border-gray-100 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <div className="flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-[10px] mb-4">
                            <div className="w-8 h-[2px] bg-primary"></div>
                            <span>Standar Redaksi</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none mb-6">
                            Pedoman <span className="text-primary text-stroke-thin">Media Siber</span>
                        </h1>
                        <p className="text-gray-600 text-lg font-medium leading-relaxed mb-4">
                            Kemerdekaan berpendapat, kemerdekaan berekspresi, dan kemerdekaan pers adalah hak asasi manusia yang dilindungi Pancasila dan UUD 1945.
                        </p>
                        <p className="text-gray-400 text-sm font-medium">Sesuai Peraturan Dewan Pers No. 1/Peraturan-DP/III/2012</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Sidebar Navigation */}
                    <div className="hidden lg:block lg:col-span-4">
                        <div className="sticky top-32 space-y-8">
                            <div className="border-l-4 border-black pl-6 py-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-black">Pedoman Utama</h3>
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

                            <div className="bg-gray-900 p-8 space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Dewan Pers</p>
                                <p className="text-xs font-medium text-gray-300 leading-relaxed italic">
                                    "NEWSLAN.ID berkomitmen menjaga integritas jurnalistik di dunia siber sesuai standar nasional."
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        <article className="prose prose-lg max-w-none prose-headings:text-black prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-headings:tracking-tighter prose-p:text-gray-600 prose-p:leading-relaxed prose-strong:text-black">

                            <section id="ruang-lingkup" className="scroll-mt-32">
                                <h2>1. Ruang Lingkup</h2>
                                <p>
                                    Media Siber adalah segala bentuk media yang menggunakan sarana internet dan melaksanakan kegiatan jurnalistik, serta memenuhi persyaratan Undang-Undang Pers dan Standar Perusahaan Pers yang ditetapkan Dewan Pers.
                                </p>
                                <p>
                                    Isi Buatan Pengguna (User Generated Content) adalah segala isi yang dibuat dan atau diunggah oleh pengguna media siber, antara lain, artikel, gambar, komentar, suara, video dan berbagai bentuk unggahan yang melekat pada media siber, seperti blog, forum, komentar pembaca atau pemirsa, dan potret.
                                </p>
                            </section>

                            <section id="verifikasi" className="scroll-mt-32 mt-16">
                                <h2>2. Verifikasi dan Keberimbangan Berita</h2>
                                <p>Pada prinsipnya setiap berita harus melalui verifikasi. Berita yang dapat merugikan pihak lain memerlukan verifikasi pada berita yang sama untuk memenuhi prinsip akurasi dan keberimbangan.</p>
                                <p>Berita yang tidak memerlukan verifikasi harus memenuhi syarat:</p>
                                <ul>
                                    <li>Berita benar-benar mengandung kepentingan publik yang mendesak.</li>
                                    <li>Sumber berita pertama adalah sumber yang jelas disebutkan identitasnya, kredibel dan kompeten.</li>
                                    <li>Subjek berita yang harus dikonfirmasi tidak diketahui keberadaannya dan atau tidak dapat diwawancarai.</li>
                                    <li>Media memberikan penjelasan kepada pembaca bahwa berita tersebut masih memerlukan verifikasi lebih lanjut.</li>
                                </ul>
                            </section>

                            <section id="user-content" className="scroll-mt-32 mt-16">
                                <h2>3. Isi Buatan Pengguna (UGC)</h2>
                                <p>Media siber wajib mencantumkan syarat dan ketentuan mengenai Isi Buatan Pengguna yang tidak bertentangan dengan Undang-Undang No. 40 Tahun 1999 tentang Pers dan Kode Etik Jurnalistik, yang mewajibkan pengguna tidak mengunggah isi yang:</p>
                                <ul>
                                    <li>Mengandung sadisme dan pornografi.</li>
                                    <li>Mengandung isi yang bersifat fitnah, kecaman, serta kata-kata jorok atau kasar.</li>
                                    <li>Menimbulkan rasa kebencian atau permusuhan Suku, Agama, Ras, dan Antar Golongan (SARA).</li>
                                    <li>Mendorong atau memicu tindakan kekerasan atau melanggar hukum.</li>
                                </ul>
                            </section>

                            <section id="ralat-koreksi" className="scroll-mt-32 mt-16">
                                <h2>4. Ralat, Koreksi, dan Hak Jawab</h2>
                                <p>
                                    Ralat, koreksi, dan hak jawab dilakukan merujuk pada Undang-Undang Pers, Kode Etik Jurnalistik, dan Pedoman Hak Jawab yang ditetapkan Dewan Pers. Ralat, koreksi dan atau hak jawab wajib ditautkan pada berita yang diralat, dikoreksi atau yang diberi hak jawab.
                                </p>
                                <p>
                                    Pada setiap berita ralat, koreksi, dan hak jawab wajib dicantumkan waktu pemuatan ralat, koreksi, dan atau hak jawab tersebut.
                                </p>
                            </section>

                            <section id="pencabutan" className="scroll-mt-32 mt-16">
                                <h2>5. Pencabutan Berita</h2>
                                <p>
                                    Berita yang sudah dipublikasikan tidak dapat dicabut karena alasan penyuntingan dari pihak luar redaksi, kecuali terkait masalah rasisme, pornografi, keberlangsungan hidup anak, pengalaman traumatik korban atau berdasarkan pertimbangan khusus lain dari Dewan Pers.
                                </p>
                                <p>
                                    Pencabutan berita wajib disertai dengan alasan pencabutan dan diumumkan kepada publik.
                                </p>
                            </section>

                            <section id="iklan" className="scroll-mt-32 mt-16">
                                <h2>6. Iklan dan Konten Komersial</h2>
                                <p>
                                    Pemuatan iklan pada media siber NEWSLAN.ID wajib dibedakan secara tegas antara isi berita dan iklan (advertorial). Setiap konten yang bersifat iklan atau berbayar wajib mencantumkan keterangan "Iklan", "Advertorial", atau "Sponsored Content".
                                </p>
                            </section>

                            <section id="hak-cipta" className="scroll-mt-32 mt-16">
                                <h2>7. Hak Cipta</h2>
                                <p>
                                    Media siber wajib menghormati hak cipta sebagaimana diatur dalam peraturan perundang-undangan yang berlaku. Penggunaan materi dari sumber lain wajib mencantumkan sumber secara jelas dan mengikuti aturan *fair use*.
                                </p>
                            </section>

                            <section id="tanggung-jawab" className="scroll-mt-32 mt-16 pb-20">
                                <h2>8. Tanggung Jawab</h2>
                                <p>
                                    Media siber NEWSLAN.ID tidak bertanggung jawab atas isi buatan pengguna (komentar/forum) yang melanggar aturan jika media telah melakukan upaya pencegahan dan penghapusan segera setelah mengetahui adanya pelanggaran tersebut.
                                </p>
                                <div className="mt-12 bg-black text-white p-10">
                                    <h4 className="text-white mt-0">Ditetapkan di Jakarta, 3 Februari 2012</h4>
                                    <p className="m-0 text-gray-400 text-sm">Disahkan oleh Dewan Pers dan diadopsi oleh Redaksi NEWSLAN.ID sebagai standar operasional pemberitaan siber.</p>
                                </div>
                            </section>
                        </article>
                    </div>
                </div>
            </div>
        </div>
    )
}
