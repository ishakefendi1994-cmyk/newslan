'use server'

export async function migrateImageToImgBB(imageUrl: string) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary credentials missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local.')
    }

    try {
        // 1. Fetch the image from WordPress server-side
        const response = await fetch(imageUrl)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 2. Prepare FormData for Cloudinary
        const formData = new FormData()
        // Convert buffer to Blob for FormData
        const blob = new Blob([buffer])
        formData.append('file', blob)
        formData.append('upload_preset', uploadPreset)

        // 3. Upload to Cloudinary
        const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        )

        const data = await uploadResponse.json()

        if (!uploadResponse.ok) {
            throw new Error(data.error?.message || 'Error uploading to Cloudinary')
        }

        return data.secure_url
    } catch (error: any) {
        console.error('Server-side Image Migration Error:', error)
        throw error
    }
}
