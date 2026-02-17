
/**
 * Download image from URL and upload to Cloudinary using Unsigned Upload
 * This method does NOT require API_KEY or API_SECRET, only Cloud Name and Upload Preset.
 */
export async function uploadRSSImageToCloudinary(
    imageUrl: string,
    folder: string = 'rss-articles'
): Promise<string | null> {
    try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

        if (!cloudName || !uploadPreset) {
            console.error('[Cloudinary] Missing configuration: cloud_name or upload_preset')
            return null
        }

        console.log('[Cloudinary] Uploading RSS image (Unsigned):', imageUrl.substring(0, 80))

        // Create FormData for the request
        const formData = new FormData()
        formData.append('file', imageUrl)
        formData.append('upload_preset', uploadPreset)
        formData.append('folder', folder)

        // Add transformation parameters if needed (though presets usually handle this)
        // Note: For unsigned uploads, transformations are often better handled in the preset settings
        // or applied to the delivery URL. We can try submitting 'context' or 'tags' if needed.

        // Perform the upload via REST API
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Cloudinary API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()

        console.log('[Cloudinary] ✅ Upload success:', data.secure_url)

        // Return the secure URL with optimization parameters applied
        // We can append q_auto, f_auto manually if the preset doesn't do it
        // But typically we just return the URL and let Next.js Image component handle resizing
        return data.secure_url

    } catch (error: any) {
        console.error('[Cloudinary] Upload failed:', error.message)

        // Return original URL as fallback
        console.warn('[Cloudinary] Using original URL as fallback')
        return imageUrl
    }
}
