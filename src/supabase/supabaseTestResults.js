import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { parseAsSydneyDate } from '../helpers/dateHelpers'

export async function fetchTestResults() {
    const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .order('test_date', { ascending: false })

    if (error) throw error

    return (data ?? []).map(r => ({
        id: r.id,
        testDate: parseAsSydneyDate(r.test_date),
        hba1c: r.hba1c,
        b12: r.b12,
        iodine: r.iodine,
        iron: r.iron,
        notes: r.notes ?? '',
    }))
}