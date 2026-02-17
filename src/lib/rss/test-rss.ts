// Test RSS Parser singkat
import { fetchRSSFeed } from './parser'
import { RSS_FEEDS } from './feeds'

async function testRSS() {
    console.log('Testing RSS Parser...')

    // Test satu feed aja - CNN Indonesia
    const cnnFeed = RSS_FEEDS.find(f => f.id === 'cnn-indonesia')

    if (!cnnFeed) {
        console.error('CNN feed not found!')
        return
    }

    console.log(`Testing feed: ${cnnFeed.name} - ${cnnFeed.url}`)

    try {
        const articles = await fetchRSSFeed(cnnFeed)
        console.log(`✅ Success! Found ${articles.length} articles`)

        if (articles.length > 0) {
            console.log('\nFirst article:')
            console.log('Title:', articles[0].title)
            console.log('Link:', articles[0].link)
            console.log('Source:', articles[0].sourceName)
        }
    } catch (error) {
        console.error('❌ Error:', error)
    }
}

testRSS()
