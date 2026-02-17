const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.local...');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260217_create_product_categories.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration...');

    // Note: Supabase JS client doesn't have a direct 'sql' method for raw queries.
    // We usually use a helper function or direct postgres connection.
    // However, for simple DDL, we can try to use a temporary RPC if it exists, 
    // but the most reliable way in this environment is often to ask the user 
    // to run it in the dashboard if we can't find a local psql/supabase-cli.

    console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:');
    console.log('------------------------------------------------------------');
    console.log(sql);
    console.log('------------------------------------------------------------');
}

runMigration();
