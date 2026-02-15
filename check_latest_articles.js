const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
try {
    const envConfig = fs.readFileSync('.env.local', 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error('Error reading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatest() {
    console.log('Fetching latest 5 articles...');
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, title, created_at, is_published, is_premium, category_id, categories(name)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Latest Articles:');
    articles.forEach(a => {
        console.log(`Title: ${a.title}`);
        console.log(`  Published: ${a.is_published}`);
        console.log(`  Premium: ${a.is_premium}`);
        console.log(`  Created At: ${a.created_at} (Parsed: ${new Date(a.created_at).toString()})`);
        console.log(`  Category: ${a.categories?.name} (${a.category_id})`);
        console.log('---');
    });
}

checkLatest();
