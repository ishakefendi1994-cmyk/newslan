const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dxflzgwpibnoiktvftwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Zmx6Z3dwaWJub2lrdHZmdHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTU2MzQsImV4cCI6MjA4NjQ3MTYzNH0.AnswFtxAz0jJ4xvWBy6gob9zZlTPVQs0skUJGPRUe1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBanners() {
    const { data, error } = await supabase.from('banners').select('*');
    if (error) {
        console.error('Error fetching banners:', error);
    } else {
        console.log('BANNERS IN DB:', JSON.stringify(data, null, 2));
    }
}

checkBanners();
