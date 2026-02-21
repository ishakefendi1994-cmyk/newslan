const { extractArticleContent } = require('./src/lib/scraper/extractor');

async function testExtraction() {
    // This is a typical Google News redirect link
    const url = 'https://news.google.com/rss/articles/CBMitAFBVV95cUxPSFhicFE3eFZiVWFWNzZGeGhRR3FtUGFSRVFiclZvcEhPblRpZWdLemJrTzJZN3gtRnFjN0NzYzVPcEJxOVZqTjJjaDUwT2U1NUlnWk5NZ0JaWGxkUkI1NGRVN2hBZGVOelFFb211NjFoLVdKdXp1VEVueDZEMUZ4ZmFSVm9ndWtreGpVbWM4bGRSeWFlakhGZHhXRzM1bEZUaExoUEJVbzBXckR3SE1Hbmt3Njg?oc=5';

    try {
        console.log(`Extracting from: ${url}`);
        const result = await extractArticleContent(url);
        console.log('Title:', result.title);
        console.log('Content Length:', result.content.length);
        console.log('Sample Content:', result.content.substring(0, 200));
    } catch (err) {
        console.error('Fatal Error:', err);
    }
}

testExtraction();
