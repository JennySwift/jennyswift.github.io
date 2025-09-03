//supabaseBG.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO, sydneyRangeUtcISOExclusive, parseAsSydneyDate, toInstant } from '../helpers/dateHelpers'

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


export async function fetchGlucoseReadingsBetween(start, end) {
    const fromISOString = toInstant(start).toISO()
    const toISOString = toInstant(end).toISO()

    let allReadings = []
    let page = 0
    const pageSize = 1000
    let done = false

    while (!done) {
        const { data, error } = await supabase
            .from('glucose_readings')
            .select('*')
            .gte('timestamp', fromISOString)
            .lt('timestamp', toISOString)
            .order('timestamp', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
            console.error('[Supabase] Error fetching glucose readings:', error)
            break
        }

        if (data.length === 0 || data.length < pageSize) {
            done = true
        }

        allReadings.push(...data)
        page++
    }

    return allReadings
}