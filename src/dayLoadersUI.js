import { fetchBolusesForDay, fetchGlucoseReadingsForDay } from './supabase/dayLoaders'

export async function loadBolusesForSelectedDay(data, loading, date) {
    loading.boluses = true
    try {
        data.boluses = await fetchBolusesForDay(date)
    } catch (e) {
        console.error('[dayLoadersUI] boluses failed:', e)
        data.boluses = []
    } finally {
        loading.boluses = false
    }
}

export async function loadGlucoseForSelectedDay(data, loading, date) {
    loading.bg = true
    try {
        data.glucoseReadings = await fetchGlucoseReadingsForDay(date)
    } catch (e) {
        console.error('[dayLoadersUI] BG failed:', e)
        data.glucoseReadings = []
    } finally {
        loading.bg = false
    }
}

// Handy helper to kick off both in parallel.
export async function loadAllForSelectedDay(data, loading, date) {
    await Promise.allSettled([
        loadBolusesForSelectedDay(data, loading, date),
        loadGlucoseForSelectedDay(data, loading, date),
    ])
}