
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
})

async function checkJobs() {
    console.log('Checking rss_auto_jobs table...')
    try {
        const { data, error } = await supabase
            .from('rss_auto_jobs')
            .select('id, name, task_key, rss_url, is_active')

        if (error) {
            console.error('Supabase Error:', error)
        } else {
            console.log('Found jobs:', data)
            if (data && data.length === 0) {
                console.log('Table is empty.')
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err)
    }
}

checkJobs()
