//supabaseNotes.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

/**
 * Fetch notes that overlap a Sydney-local day.
 * Table columns: id (uuid), text (text), start_time (timestamptz), end_time (timestamptz?),
 * tags (text[]?)
 */
export async function fetchNotesForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) {
        throw new Error('fetchNotesForDay: date is invalid')
    }

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    // Overlap condition:
    // start_time < endOfDay  AND  (end_time IS NULL OR end_time >= startOfDay)
    const { data, error } = await supabase
        .from('notes')
        .select('id, text, start_time, end_time, tags')
        .lt('start_time', endUtcISO)
        .or(`end_time.is.null,end_time.gte.${startUtcISO}`)
        .order('start_time', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        id: r.id,
        text: r.text ?? '',
        // keep Date objects in the UI:
        timestamp: DateTime.fromISO(r.start_time).toJSDate(),
        endTime: r.end_time ? DateTime.fromISO(r.end_time).toJSDate() : null,
        tags: Array.isArray(r.tags) ? r.tags : [],
        // noteNumber is not stored; omit so UI won’t show "#undefined"
    }))
}