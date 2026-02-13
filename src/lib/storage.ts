import { createClient } from './supabase/client'

export async function uploadImage(file: File) {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY

    if (!apiKey) {
        throw new Error('ImgBB API Key missing. Please set NEXT_PUBLIC_IMGBB_API_KEY in .env.local.')
    }

    const formData = new FormData()
    formData.append('image', file)

    try {
        const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${apiKey}`,
            {
                method: 'POST',
                body: formData,
            }
        )

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.error.message || 'Error uploading to ImgBB')
        }

        return data.data.url
    } catch (error: any) {
        console.error('ImgBB Upload Error:', error)
        throw error
    }
}
export async function uploadImageFromUrl(url: string) {
    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch image from URL')

        const blob = await response.blob()
        const fileName = url.split('/').pop() || 'image.jpg'
        const file = new File([blob], fileName, { type: blob.type })

        return await uploadImage(file)
    } catch (error) {
        console.error('Error in uploadImageFromUrl:', error)
        throw error
    }
}
