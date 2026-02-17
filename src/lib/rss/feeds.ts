// RSS Feed Sources Configuration - Comprehensive Indonesian & International News
export const RSS_FEEDS = [
    // === CNN INDONESIA ===
    {
        id: 'cnn-indonesia',
        name: 'CNN Indonesia - All',
        url: 'https://www.cnnindonesia.com/rss',
        category: 'Berita Nasional',
        country: 'Indonesia'
    },

    // === TEMPO.CO ===
    {
        id: 'tempo-terkini',
        name: 'Tempo - Terkini',
        url: 'https://rss.tempo.co/terkini',
        category: 'Berita Terkini',
        country: 'Indonesia'
    },
    {
        id: 'tempo-nasional',
        name: 'Tempo - Nasional',
        url: 'https://rss.tempo.co/nasional',
        category: 'Berita Nasional',
        country: 'Indonesia'
    },
    {
        id: 'tempo-bisnis',
        name: 'Tempo - Bisnis',
        url: 'https://rss.tempo.co/bisnis',
        category: 'Bisnis',
        country: 'Indonesia'
    },
    {
        id: 'tempo-metro',
        name: 'Tempo - Metro',
        url: 'https://rss.tempo.co/metro',
        category: 'Metropolitan',
        country: 'Indonesia'
    },
    {
        id: 'tempo-olahraga',
        name: 'Tempo - Olahraga',
        url: 'https://rss.tempo.co/olahraga',
        category: 'Olahraga',
        country: 'Indonesia'
    },

    // === KOMPAS.COM ===
    {
        id: 'kompas-all',
        name: 'Kompas - All',
        url: 'https://www.kompas.com/rss/',
        category: 'Berita Terkini',
        country: 'Indonesia'
    },
    {
        id: 'kompas-nasional',
        name: 'Kompas - Nasional',
        url: 'https://rss.kompas.com/nasional',
        category: 'Berita Nasional',
        country: 'Indonesia'
    },
    {
        id: 'kompas-megapolitan',
        name: 'Kompas - Megapolitan',
        url: 'https://rss.kompas.com/megapolitan',
        category: 'Metropolitan',
        country: 'Indonesia'
    },
    {
        id: 'kompas-money',
        name: 'Kompas - Money',
        url: 'https://rss.kompas.com/money',
        category: 'Bisnis',
        country: 'Indonesia'
    },
    {
        id: 'kompas-tekno',
        name: 'Kompas - Tekno',
        url: 'https://rss.kompas.com/tekno',
        category: 'Teknologi',
        country: 'Indonesia'
    },
    {
        id: 'kompas-entertainment',
        name: 'Kompas - Entertainment',
        url: 'https://rss.kompas.com/entertainment',
        category: 'Hiburan',
        country: 'Indonesia'
    },

    // === DETIK.COM ===
    {
        id: 'detik-all',
        name: 'Detik - All',
        url: 'https://rss.detik.com/index.php/detikcom',
        category: 'Berita Terkini',
        country: 'Indonesia'
    },
    {
        id: 'detik-finance',
        name: 'Detik - Finance',
        url: 'https://rss.detik.com/index.php/detikfinance',
        category: 'Bisnis',
        country: 'Indonesia'
    },
    {
        id: 'detik-inet',
        name: 'Detik - Inet',
        url: 'https://rss.detik.com/index.php/detikinet',
        category: 'Teknologi',
        country: 'Indonesia'
    },
    {
        id: 'detik-oto',
        name: 'Detik - Oto',
        url: 'https://rss.detik.com/index.php/detikoto',
        category: 'Otomotif',
        country: 'Indonesia'
    },

    // === LIP UTAN6 ===
    {
        id: 'liputan6-all',
        name: 'Liputan6 - All',
        url: 'https://www.liputan6.com/rss',
        category: 'Berita Terkini',
        country: 'Indonesia'
    },
    {
        id: 'liputan6-news',
        name: 'Liputan6 - News',
        url: 'https://www.liputan6.com/news/rss',
        category: 'Berita Nasional',
        country: 'Indonesia'
    },
    {
        id: 'liputan6-bisnis',
        name: 'Liputan6 - Bisnis',
        url: 'https://www.liputan6.com/bisnis/rss',
        category: 'Bisnis',
        country: 'Indonesia'
    },
    {
        id: 'liputan6-tekno',
        name: 'Liputan6 - Tekno',
        url: 'https://www.liputan6.com/tekno/rss',
        category: 'Teknologi',
        country: 'Indonesia'
    },

    // === ANTARA NEWS ===
    {
        id: 'antara-terkini',
        name: 'Antara - Terkini',
        url: 'https://www.antaranews.com/rss/terkini.xml',
        category: 'Berita Terkini',
        country: 'Indonesia'
    },
    {
        id: 'antara-nasional',
        name: 'Antara - Nasional',
        url: 'https://www.antaranews.com/rss/nasional.xml',
        category: 'Berita Nasional',
        country: 'Indonesia'
    },
    {
        id: 'antara-ekonomi',
        name: 'Antara - Ekonomi',
        url: 'https://www.antaranews.com/rss/ekonomi.xml',
        category: 'Bisnis',
        country: 'Indonesia'
    },

    // === TRIBUN NEWS ===
    {
        id: 'tribun-all',
        name: 'Tribun News - All',
        url: 'https://www.tribunnews.com/rss',
        category: 'Berita Terkini',
        country: 'Indonesia'
    },

    // === INTERNATIONAL ===
    {
        id: 'bbc-indonesia',
        name: 'BBC Indonesia',
        url: 'https://feeds.bbci.co.uk/indonesia/rss.xml',
        category: 'Berita Internasional',
        country: 'International'
    },
    {
        id: 'aljazeera',
        name: 'Al Jazeera',
        url: 'https://www.aljazeera.com/xml/rss/all.xml',
        category: 'Berita Internasional',
        country: 'International'
    }
] as const

export type RSSFeed = typeof RSS_FEEDS[number]

// Helper untuk group feeds by outlet
export const FEED_GROUPS = {
    'CNN Indonesia': RSS_FEEDS.filter(f => f.id.startsWith('cnn-')),
    'Tempo': RSS_FEEDS.filter(f => f.id.startsWith('tempo-')),
    'Kompas': RSS_FEEDS.filter(f => f.id.startsWith('kompas-')),
    'Detik': RSS_FEEDS.filter(f => f.id.startsWith('detik-')),
    'Liputan6': RSS_FEEDS.filter(f => f.id.startsWith('liputan6-')),
    'Antara': RSS_FEEDS.filter(f => f.id.startsWith('antara-')),
    'Tribun': RSS_FEEDS.filter(f => f.id.startsWith('tribun-')),
    'International': RSS_FEEDS.filter(f => f.country === 'International')
}
