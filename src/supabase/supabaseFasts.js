// supabaseFasts.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

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