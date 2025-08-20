// supabaseBasal.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

export async function fetchBasalEntriesForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) throw new Error('fetchBasalEntriesForDay: date is invalid')

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    const { data, error } = await supabase
        .from('basal_entries')
        .select('start_time, end_time, rate, mode, notes')
        // overlap with the day:
        .lt('start_time', endUtcISO)
        .or(`end_time.is.null,end_time.gt.${startUtcISO}`)
        .order('start_time', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        startTime: DateTime.fromISO(r.start_time).toJSDate(),
        endTime:   r.end_time ? DateTime.fromISO(r.end_time).toJSDate() : null,
        rate:      Number(r.rate ?? 0),
        mode:      r.mode ?? null,
        notes:     r.notes ?? null,
    }))
}

/**
 * Close open-ended segments at the *pump upload time* .
 * For display, also clip to the selected day window.
 */
export function finalizeBasalForUIWithPumpUpload(entries, selectedDate, pumpUploadTime) {
    const sel = DateTime.fromJSDate(selectedDate).setZone('Australia/Sydney')
    const dayStart = sel.startOf('day').toJSDate()
    const dayEnd   = sel.endOf('day').toJSDate()

    const pumpDT = pumpUploadTime ? DateTime.fromJSDate(pumpUploadTime) : null
    const pumpJS = pumpDT ? pumpDT.toJSDate() : null

    const out = []
    for (const e of entries) {
        // Real end = given end or pump upload time (if we have one)
        const realEnd = e.endTime ?? pumpJS
        // If still no end (no pump time available), leave as-is (the chart code will clip)
        const clipStart = e.startTime < dayStart ? dayStart : e.startTime
        const clipEnd   = realEnd ? (realEnd > dayEnd ? dayEnd : realEnd) : dayEnd

        // Keep only if it still overlaps the selected day
        if (clipStart < clipEnd) {
            out.push({
                ...e,
                // show clipped times so charts/tabs are accurate per-day
                startTime: clipStart,
                endTime: realEnd ? clipEnd : null,
            })
        }
    }
    return out
}