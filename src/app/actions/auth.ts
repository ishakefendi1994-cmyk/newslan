'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function grantAdminAccess() {
    try {
        // 1. Get current user from the session (standard auth)
        const supabase = await createServerClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            throw new Error('User not authenticated')
        }

        // 2. Use Service Role to bypass RLS and update the profile
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const { error: updateError } = await adminSupabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id)

        if (updateError) {
            throw new Error(`Failed to update role: ${updateError.message}`)
        }

        revalidatePath('/admin')
        return { success: true, message: 'Admin access granted! Please refresh the page.' }
    } catch (error: any) {
        console.error('Grant Admin Error:', error)
        return { success: false, message: error.message }
    }
}
