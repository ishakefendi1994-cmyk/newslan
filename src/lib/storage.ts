import { createClient } from './supabase/client'
import imageCompression from 'browser-image-compression'

export async function uploadImage(file: File) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary credentials missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local.')
    }

    // Compress Image
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
    }

    try {
        const compressedFile = await imageCompression(file, options)

        const formData = new FormData()
        formData.append('file', compressedFile)
        formData.append('upload_preset', uploadPreset)

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
        console.error('Cloudinary Upload/Compression Error:', error)
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
