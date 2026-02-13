import { NextResponse } from 'next/server'
import { createDuitkuTransaction } from '@/lib/duitku'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { amount, planName } = await req.json()
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const merchantOrderId = `SUB-${user.id.slice(0, 8)}-${Date.now()}`

        const result = await createDuitkuTransaction({
            paymentAmount: amount,
            merchantOrderId,
            productDetails: `NEWSLAN ${planName} Subscription`,
            email: user.email!,
            callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/callback`,
            returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/subscribe/success`,
        })

        if (result.paymentUrl) {
            return NextResponse.json({ paymentUrl: result.paymentUrl })
        }

        return NextResponse.json({ error: result.message || 'Payment creation failed' }, { status: 500 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
