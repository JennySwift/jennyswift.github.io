//supabaseWeights.js
import { supabase } from './supabase'
import { sydneyRangeUtcISOExclusive } from '../helpers/dateHelpers'

// Returns [{ timestamp, value }] where value is kilograms (Number)
export async function fetchWeightsBetween(startDate, endDate) {
    const { startUtcISO, endUtcISO } = sydneyRangeUtcISOExclusive(startDate, endDate)

    const { data, error } = await supabase
        .from('weights')
        .select('timestamp, value')
        .gte('timestamp', startUtcISO)
        .lt('timestamp', endUtcISO)
        .order('timestamp', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        timestamp: r.timestamp,
        value: Number(r.value)
    }))
}