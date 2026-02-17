/**
 * Force HTML formatting for article content
 * Ensures content is properly structured with <p> tags, <h2> headings, etc.
 * regardless of AI output quality.
 */

export function forceHtmlFormatting(content: string, title: string): string {
    if (!content) return ''

    // 1. Check if content already has HTML tags
    if (content.includes('<p>') && content.includes('</p>')) {
        return content
    }

    console.log('[HTML Formatter] converting plain text to HTML...')

    // 2. Split into blocks by double newlines
    let blocks = content.split(/\n\n+/)

    // 3. Fallback for single block text (no newlines)
    if (blocks.length <= 1) {
        // Split by sentences (look for . ! ? followed by space and capital letter)
        const sentences = content.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [content]

        // Group sentences into paragraphs (3-4 sentences per paragraph)
        const newBlocks = []
        let currentBlock = ''
        let count = 0

        sentences.forEach((sentence) => {
            currentBlock += sentence.trim() + ' '
            count++
            if (count >= 3) {
                newBlocks.push(currentBlock.trim())
                currentBlock = ''
                count = 0
            }
        })
        if (currentBlock) newBlocks.push(currentBlock.trim())
        blocks = newBlocks
    }

    // 4. Process each block
    const formattedBlocks = blocks
        .map(block => block.trim())
        .filter(block => block.length > 0)
        .map(block => {
            // Check if it's a list item
            if (block.match(/^[1-9]\.|^-\s|^•\s/)) {
                // Convert lines starting with numbers/bullets to list items
                const items = block.split('\n').map(line => `<li>${line.replace(/^[1-9]\.|^-\s|^•\s/, '').trim()}</li>`).join('')
                return `<ul>${items}</ul>`
            }

            // Check if it's a heading (short, no period at end, title case-ish)
            if (block.length < 100 && !block.endsWith('.') && block.length > 5 && /^[A-Z]/.test(block)) {
                return `<h2>${block}</h2>`
            }

            // Default: It's a paragraph
            return `<p>${block}</p>`
        })

    return formattedBlocks.join('\n\n')
}
