/**
 * Formats a number or string into Indonesian Rupiah (IDR) format.
 * Handles single values and ranges (e.g., "10000 - 20000").
 */
export function formatRupiah(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return 'Hubungi untuk harga'
    }

    const strValue = String(value).trim()

    // If it already seems formatted with Rp, just return it
    if (strValue.toLowerCase().startsWith('rp')) {
        return strValue
    }

    // Check if it's a range (e.g., "10000 - 20000" or "10000-20000")
    if (strValue.includes('-')) {
        const parts = strValue.split('-').map(p => p.trim())
        return parts.map(p => formatSingleValue(p)).join(' - ')
    }

    return formatSingleValue(strValue)
}

function formatSingleValue(val: string): string {
    // Remove any non-numeric characters except for the ones we might want to keep
    const numericValue = val.replace(/[^0-9]/g, '')

    if (numericValue === '') {
        return val // Return original if no numbers found (e.g. "Gratis")
    }

    const amount = parseInt(numericValue, 10)

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

/**
 * Optimizes Cloudinary URLs by injecting f_auto,q_auto and optional params
 */
export function optimizeCloudinaryUrl(
    url: string,
    options?: { width?: number; quality?: string }
): string {
    if (!url || !url.includes('cloudinary.com')) return url

    // Helper to build transformation string
    const transforms = ['f_auto']

    // Quality (default to q_auto if not specified, or use provided like 'q_auto:eco')
    transforms.push(options?.quality ? `q_${options.quality}` : 'q_auto')

    // Width (if specified)
    if (options?.width) {
        transforms.push(`w_${options.width}`)
        transforms.push('c_limit') // Ensure we don't upscale, just limit
    }

    const transformString = transforms.join(',')

    // If already has some optimization (basic check), we might want to replace or just append?
    // For simplicity, this regex replaces the first /upload/ with /upload/{transforms}/
    // It does NOT handle if there are already params there cleanly without more complex parsing,
    // but for standard Cloudinary URLs it works.
    if (url.includes('/upload/')) {
        // Remove existing widespread optimizations if any to avoid duplication/conflict if we are strict
        // But here we'll just replace /upload/ with our new set.
        return url.replace('/upload/', `/upload/${transformString}/`)
    }

    return url
}
