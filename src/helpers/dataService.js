export async function fetchDashboardData() {
    const dropboxUrl = 'https://dl.dropboxusercontent.com/scl/fi/0udoq3x6gkchstkq2hqxg/glucoseData.json?rlkey=vllvwb6wlx2el12c9aqijw37p'

    // Try local first (fast in dev, no commit needed)
    let response = await fetch('/glucoseData.json', { cache: 'no-store' })

    if (!response.ok) {
        console.warn('[fetchDashboardData] local /glucoseData.json missing; falling back to Dropbox')
        response = await fetch(dropboxUrl, { cache: 'no-store' })
    }

    if (!response.ok) {
        throw new Error(`[fetchDashboardData] HTTP ${response.status}`)
    }

    const data = await response.json()

    console.log('[fetchDashboardData] loaded', {
        hasGlucoseReadings: !!data.glucoseReadings,
        hasFoodLogs: !!data.foodLogs,
        hasBolusDoses: !!data.bolusDoses,
        keys: Object.keys(data || {})
    })

    return data
}
