const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS for debugging

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHomeData() {
    console.log('Checking Categories with show_on_home = true...');
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name, slug, show_on_home')
        .eq('show_on_home', true);

    if (catError) {
        console.error('Error fetching categories:', catError);
        return;
    }

    console.log(`Found ${categories.length} categories for home page:`);
    categories.forEach(c => console.log(`- ${c.name} (${c.id})`));

    if (categories.length === 0) {
        console.log('Use Supabase dashboard to set "show_on_home" to true for some categories.');
        return;
    }

    console.log('\nChecking Articles for these categories...');
    for (const cat of categories) {
        const { data: articles, error: artError } = await supabase
            .from('articles')
            .select('id, title, is_published')
            .eq('category_id', cat.id)
            .eq('is_published', true)
            .limit(5);

        if (artError) {
            console.error(`Error fetching articles for ${cat.name}:`, artError);
        } else {
            console.log(`Category "${cat.name}": Found ${articles.length} published articles.`);
            articles.forEach(a => console.log(`  - ${a.title}`));
        }
    }
}

checkHomeData();
