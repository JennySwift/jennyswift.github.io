// supabaseFasts.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

export async function fetchTotalFastOverlapSeconds(startUtcISO, endUtcISO) {
    const { data, error } = await supabase
        .rpc('total_fast_overlap_seconds', { s: startUtcISO, e: endUtcISO })
    if (error) throw error
    return data ?? 0 // seconds
}

/**
 * Fetch all fasts that overlap the selected Sydney day.
 * Overlap condition:
 *   (start_time < endOfDayUTC) AND (end_time IS NULL OR end_time > startOfDayUTC)
 */
export async function fetchFastsForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) {
        throw new Error('fetchFastsForDay: date is invalid')
    }

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    const { data, error } = await supabase
        .from('fasts')
        .select('id, start_time, end_time, notes')
        .lt('start_time', endUtcISO)
        .or(`end_time.is.null,end_time.gt.${startUtcISO}`)
        .order('start_time', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        id: r.id,
        startTime: DateTime.fromISO(r.start_time).toJSDate(),
        endTime: r.end_time ? DateTime.fromISO(r.end_time).toJSDate() : null,
        notes: r.notes ?? '',
    }))
}

// Get Sydney week's [start, end) in UTC ISO
function sydneyWeekRangeUtcISO(anchorDate) {
    const anchor = anchorDate instanceof Date ? anchorDate : new Date(anchorDate)
    const sydney = DateTime.fromJSDate(anchor, { zone: 'Australia/Sydney' })
    const start = sydney.startOf('week')        // week starts Monday by default (ISO)
    const end   = start.plus({ days: 7 })
    return {
        startUtcISO: start.toUTC().toISO({ suppressMilliseconds: true }),
        endUtcISO:   end.toUTC().toISO({ suppressMilliseconds: true }),
        startSydney: start, // handy for labels
        endSydney:   end,
    }
}

/**
 * Calls RPC to get average fast duration (seconds) for a given date range.
 * @param {Date|string} startUtcISO
 * @param {Date|string} endUtcISO
 * @returns {number|null} average seconds (nullable if no data)
 */
export async function fetchAverageFastDurationSeconds(startUtcISO, endUtcISO) {
    // Ensure ISO strings
    const startISO = typeof startUtcISO === 'string'
        ? startUtcISO
        : DateTime.fromJSDate(startUtcISO).toUTC().toISO({ suppressMilliseconds: true })

    const endISO = typeof endUtcISO === 'string'
        ? endUtcISO
        : DateTime.fromJSDate(endUtcISO).toUTC().toISO({ suppressMilliseconds: true })

    const { data, error } = await supabase
        .rpc('avg_fast_duration', { start_ts: startISO, end_ts: endISO })

    if (error) throw error
    // `data` is a number or null
    return data
}

export { sydneyWeekRangeUtcISO }