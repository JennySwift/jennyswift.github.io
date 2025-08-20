import { fetchBolusesForDay, fetchGlucoseReadingsForDay } from './supabase/dayLoaders'
import { fetchBasalEntriesForDay, finalizeBasalForUIWithPumpUpload } from './supabase/supabaseBasal'
import { fetchDashboardData } from './helpers/dataService'
import { fetchNotesForDay } from './supabase/supabaseNotes'

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

export async function loadBasalForSelectedDay(data, loading, date) {
    loading.basal = true
    try {
        // Get basal rows overlapping the day + the pump upload time (for accurate closing)
        const [entries, dashboard] = await Promise.all([
            fetchBasalEntriesForDay(date),
            fetchDashboardData(), // should include { pumpUploadTime }
        ])
        const pumpUploadTime =
            dashboard?.pumpUploadTime ? new Date(dashboard.pumpUploadTime) : null

        data.basalEntries = finalizeBasalForUIWithPumpUpload(entries, date, pumpUploadTime)
    } catch (e) {
        console.error('[dayLoadersUI] basal failed:', e)
        data.basalEntries = []
    }
    finally {
        loading.basal = false
    }
}

export async function loadNotesForSelectedDay(data, loading, date) {
    loading.notes = true
    try {
        data.notes = await fetchNotesForDay(date)
    } catch (e) {
        console.error('[dayLoadersUI] notes failed:', e)
        data.notes = []
    } finally {
        loading.notes = false
    }
}



// Handy helper to kick off both in parallel.
export async function loadAllForSelectedDay(data, loading, date) {
    await Promise.allSettled([
        loadBolusesForSelectedDay(data, loading, date),
        loadGlucoseForSelectedDay(data, loading, date),
        loadBasalForSelectedDay(data, loading, date),
        loadNotesForSelectedDay(data, loading, date),
    ])
}