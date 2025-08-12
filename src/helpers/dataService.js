export async function fetchDashboardData() {
    const url = 'https://dl.dropboxusercontent.com/scl/fi/0udoq3x6gkchstkq2hqxg/glucoseData.json?rlkey=vllvwb6wlx2el12c9aqijw37p'
    const res = await fetch(url, { cache: 'no-cache' })
    if (!res.ok) {
        throw new Error(`[fetchDashboardData] HTTP ${res.status}`)
    }
    const data = await res.json()
    // For now, return raw; we’ll shape it in the next step
    console.log('[fetchDashboardData] loaded', {
        hasGlucoseReadings: !!data.glucoseReadings,
        hasFoodLogs: !!data.foodLogs,
        hasBolusDoses: !!data.bolusDoses,
        keys: Object.keys(data || {})
    })
    return data
}