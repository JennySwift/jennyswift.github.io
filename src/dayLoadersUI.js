//dayLoadersUI.js
import { fetchBolusesForDay, fetchGlucoseReadingsForDay, fetchFoodLogsForDay, fetchFastsForDay, fetchWorkoutsForDay } from './supabase/dayLoaders'
import { fetchBasalEntriesForDay, finalizeBasalForUIWithPumpUpload } from './supabase/supabaseBasal'
import { fetchNotesForDay } from './supabase/supabaseNotes'
import { formatDateTimeInSydney } from './helpers/dateHelpers'
import { fetchPumpUploadTime } from './supabase/supabaseSettings'

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
        const [entries, settings] = await Promise.all([
            fetchBasalEntriesForDay(date),
            fetchPumpUploadTime(),
        ])

        const pumpUploadTime = settings?.pumpUploadTime
            ? new Date(settings.pumpUploadTime)
            : null

        if (pumpUploadTime) {
            console.log('[dayLoadersUI] Pump upload time:', formatDateTimeInSydney(pumpUploadTime))
        }

        data.basalEntries = finalizeBasalForUIWithPumpUpload(entries, date, pumpUploadTime)
    } catch (e) {
        console.error('[dayLoadersUI] basal failed:', e)
        data.basalEntries = []
    } finally {
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

export async function loadFoodLogsForSelectedDay(data, loading, date) {
    loading.foodLogs = true
    try {
        data.foodLogs = await fetchFoodLogsForDay(date)
    } catch (e) {
        console.error('[dayLoadersUI] food logs failed:', e)
        data.foodLogs = []
    } finally {
        loading.foodLogs = false
    }
}

export async function loadFastsForSelectedDay(data, loading, date) {
    loading.fasts = true
    try {
        data.fasts = await fetchFastsForDay(date)
    } catch (e) {
        console.error('[dayLoadersUI] fasts failed:', e)
        data.fasts = []
    } finally {
        loading.fasts = false
    }
}

export async function loadWorkoutsForSelectedDay(data, loading, date) {
    loading.workouts = true
    try {
        data.workouts = await fetchWorkoutsForDay(date)
    } catch (e) {
        console.error('[dayLoadersUI] workouts failed:', e)
        data.workouts = []
    } finally {
        loading.workouts = false
    }
}



// Handy helper to kick off both in parallel.
export async function loadAllForSelectedDay(data, loading, date) {
    await Promise.allSettled([
        loadBolusesForSelectedDay(data, loading, date),
        loadGlucoseForSelectedDay(data, loading, date),
        loadBasalForSelectedDay(data, loading, date),
        loadNotesForSelectedDay(data, loading, date),
        loadFoodLogsForSelectedDay(data, loading, date),
        loadFastsForSelectedDay(data, loading, date),
        loadWorkoutsForSelectedDay(data, loading, date),
    ])
}