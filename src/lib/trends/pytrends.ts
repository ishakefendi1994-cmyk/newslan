import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execPromise = promisify(exec)

/**
 * Get trending keywords from Google Trends using pytrends (Python)
 * @param region 'local' (ID) or 'western' (US)
 * @param niche Niche name (technology, business, etc.)
 */
export async function getTrendingKeywords(region: 'local' | 'western' = 'local', niche: string = 'any'): Promise<string[]> {
    try {
        const geo = region === 'western' ? 'US' : 'ID'
        const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'pytrends_gatherer.py')

        console.log(`[Trends Bridge] Executing Python gatherer for region: ${geo}, niche: ${niche}`)

        // Execute the python script
        const { stdout, stderr } = await execPromise(`python "${scriptPath}" ${geo} ${niche}`)

        if (stderr) {
            console.warn('[Trends Bridge] Python Warning/Error:', stderr)
        }

        if (!stdout || stdout.trim() === '') {
            return []
        }

        try {
            const keywords = JSON.parse(stdout)
            return Array.isArray(keywords) ? keywords : []
        } catch (parseError) {
            console.error('[Trends Bridge] Failed to parse Python output:', stdout)
            return []
        }
    } catch (error) {
        console.error('[Trends Bridge] Error fetching trends:', error)
        return []
    }
}
