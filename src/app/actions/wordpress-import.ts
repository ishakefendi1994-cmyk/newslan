'use server'

export async function migrateImageToImgBB(imageUrl: string) {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY

    if (!apiKey) {
        throw new Error('ImgBB API Key missing')
    }

    try {
        // 1. Fetch the image from WordPress server-side
        const response = await fetch(imageUrl)
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 2. Prepare FormData for ImgBB
        const formData = new FormData()
        // Convert buffer to Blob for FormData
        const blob = new Blob([buffer])
        formData.append('image', blob)

        // 3. Upload to ImgBB
        const uploadResponse = await fetch(
            `https://api.imgbb.com/1/upload?key=${apiKey}`,
            {
                method: 'POST',
                body: formData,
            }
        )

        const data = await uploadResponse.json()

        if (!data.success) {
            throw new Error(data.error?.message || 'Error uploading to ImgBB')
        }

        return data.data.url
    } catch (error: any) {
        console.error('Server-side Image Migration Error:', error)
        throw error
    }
}
