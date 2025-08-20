//supabaseBoluses.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

/**
 * Fetch boluses for a Sydney-local day, returned with JS Date timestamps.
 * Accepts a Date (or anything Date can parse).
 */
export async function fetchBolusesForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) {
        throw new Error('fetchBolusesForDay: date is invalid')
    }

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    const { data, error } = await supabase
        .from('boluses')
        .select('timestamp, amount, type, notes')
        .gte('timestamp', startUtcISO)
        .lt('timestamp', endUtcISO)
        .order('timestamp', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        timestamp: DateTime.fromISO(r.timestamp).toJSDate(), // DB → JS Date
        amount: Number(r.amount ?? 0),
        type: r.type ?? null,
        notes: r.notes ?? null,
    }))
}