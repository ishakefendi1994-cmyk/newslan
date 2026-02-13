import { createClient } from './supabase/client'

export async function uploadImage(file: File) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary credentials missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        )

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error?.message || 'Error uploading to Cloudinary')
        }

        // Return the secure URL (HTTPS)
        return data.secure_url
    } catch (error: any) {
        console.error('Cloudinary Upload Error:', error)
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
