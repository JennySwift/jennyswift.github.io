import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

export async function fetchGlucoseReadingsForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) {
        throw new Error('fetchGlucoseReadingsForDay: date is invalid')
    }

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    const { data, error } = await supabase
        .from('glucose_readings')
        .select('timestamp, value')
        .gte('timestamp', startUtcISO)
        .lt('timestamp', endUtcISO)
        .order('timestamp', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        timestamp: DateTime.fromISO(r.timestamp).toJSDate(), // DB → JS Date
        value: Number(r.value ?? 0),
    }))
}