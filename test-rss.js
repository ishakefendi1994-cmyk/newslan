const Parser = require('rss-parser');
const parser = new Parser();

async function testSearch(keyword, hl = 'id', gl = 'ID', ceid = 'ID:id') {
    const urls = [
        `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=${hl}&gl=${gl}&ceid=${ceid}&tbs=qdr:d`,
        `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=${hl}&gl=${gl}&ceid=${ceid}`
    ];

    for (const url of urls) {
        try {
            console.log(`Testing URL: ${url}`);
            const feed = await parser.parseURL(url);
            console.log(`Items found: ${feed.items.length}`);
            if (feed.items.length > 0) {
                console.log(`First item: ${feed.items[0].title}`);
                console.log(`Link: ${feed.items[0].link}`);
            }
        } catch (err) {
            console.error(`Error for ${url}:`, err.message);
        }
        console.log('---');
    }
}

const kw = process.argv[2] || 'Tangerang';
testSearch(kw);
