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
