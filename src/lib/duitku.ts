import crypto from 'crypto'

const MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || ''
const API_KEY = process.env.DUITKU_API_KEY || ''
const DUITKU_URL = 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry' // Production URL

export async function createDuitkuTransaction(params: {
    paymentAmount: number
    merchantOrderId: string
    productDetails: string
    email: string
    callbackUrl: string
    returnUrl: string
}) {
    const { paymentAmount, merchantOrderId, productDetails, email, callbackUrl, returnUrl } = params

    const signature = crypto
        .createHash('md5')
        .update(MERCHANT_CODE + merchantOrderId + paymentAmount + API_KEY)
        .digest('hex')

    const body = {
        merchantCode: MERCHANT_CODE,
        paymentAmount,
        merchantOrderId,
        productDetails,
        email,
        callbackUrl,
        returnUrl,
        signature,
        expiryPeriod: 1440 // 24 hours
    }

    const response = await fetch(DUITKU_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    return await response.json()
}

export function verifyDuitkuCallback(params: {
    merchantCode: string
    amount: string
    merchantOrderId: string
    signature: string
}) {
    const { merchantCode, amount, merchantOrderId, signature } = params
    const recalculatedSignature = crypto
        .createHash('md5')
        .update(merchantCode + amount + merchantOrderId + API_KEY)
        .digest('hex')

    return recalculatedSignature === signature
}
