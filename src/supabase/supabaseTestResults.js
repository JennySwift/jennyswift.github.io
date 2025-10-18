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
        //diabetic related
        hba1c: r.hba1c,
        //iron related
        iron: r.iron,
        transferrin: r.transferrin,
        tibc: r.tibc,
        saturation: r.saturation,
        ferritin: r.ferritin,
        zinc: r.zinc,
        copper: r.copper,
        //thyroid
        tsh: r.tsh,
        t4: r.t4,
        t3: r.t3,
        //other
        b12: r.b12,
        iodine: r.iodine,
        //notes
        notes: r.notes ?? '',
    }))
}