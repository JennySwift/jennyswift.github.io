// supabaseFoodLogs.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO, sydneyRangeUtcISOExclusive } from '../helpers/dateHelpers'

//For the weekly calories tab
export async function fetchFoodLogsBetween(startDate, endDate, tz = 'Australia/Sydney') {
    const { startUtcISO, endUtcISO, startSydney, endSydney } =
        sydneyRangeUtcISOExclusive(startDate, endDate, { withMillis: true })

    console.log('[weekly fetch] Sydney window:', startSydney.toISO(), '→', endSydney.toISO(), '(exclusive)')
    console.log('[weekly fetch] UTC filter   :', startUtcISO, '→', endUtcISO, '(exclusive)')

    const pageSize = 1000
    let from = 0
    let to   = pageSize - 1
    let all = []

    // paginate until we get fewer than pageSize rows
    // (Supabase range() is inclusive, so 0..999 = 1000 rows)
    /* eslint-disable no-constant-condition */
    while (true) {
        const { data, error } = await supabase
            .from('food_logs')
            .select('timestamp, calories')
            .gte('timestamp', startUtcISO)
            .lt('timestamp', endUtcISO)
            .order('timestamp', { ascending: true })
            .range(from, to)

        if (error) throw error

        const batch = data ?? []
            all = all.concat(batch)

            console.log('[weekly fetch] page', `${from}-${to}`, 'rows:', batch.length)

        if (batch.length < pageSize) break
        from += pageSize
        to   += pageSize
    }

    if (all.length) {
        console.log('[weekly fetch] total rows:', all.length,
            'first:', all[0].timestamp,
            'last:',  all[all.length - 1].timestamp)
    } else {
        console.log('[weekly fetch] total rows: 0')
    }

    return all.map(r => ({
        timestamp: r.timestamp,
        calories: Number(r.calories ?? 0),
    }))
}
// export async function fetchFoodLogsBetween(startDate, endDate, tz = 'Australia/Sydney') {
//     const startISO = DateTime.fromJSDate(startDate, { zone: tz }).toUTC().toISO()
//     const endISO   = DateTime.fromJSDate(endDate,   { zone: tz }).toUTC().toISO()
//
//     const { data, error } = await supabase
//         .from('food_logs')              // adjust table name/columns if different
//         .select('timestamp, calories')  // ensure this matches your schema
//         .gte('timestamp', startISO)
//         .lt('timestamp', endISO)
//         .order('timestamp', { ascending: true })
//
//     if (error) throw error
//     return (data ?? []).map(r => ({
//         timestamp: r.timestamp,
//         calories: Number(r.calories ?? 0),
//     }))
// }

export async function fetchFoodLogsForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) {
        throw new Error('fetchFoodLogsForDay: date is invalid')
    }

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    const { data, error } = await supabase
        .from('food_logs')
        .select(`
      id,
      food_name,
      timestamp,
      quantity,
      net_carbs,
      calories,
      fat,
      protein,
      total_carbs,
      fibre,
      is_unfinished,
      resumed_at,
      food_tags
    `)
        .gte('timestamp', startUtcISO)
        .lt('timestamp', endUtcISO)
        .order('timestamp', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        id: r.id,
        foodName: r.food_name ?? 'Unknown',
        timestamp: DateTime.fromISO(r.timestamp).toJSDate(),
        quantity: r.quantity,
        netCarbs: r.net_carbs,
        calories: r.calories,
        fat: r.fat,
        protein: r.protein,
        totalCarbs: r.total_carbs,
        fibre: r.fibre,
        isUnfinished: r.is_unfinished,
        resumedAt: r.resumed_at ? DateTime.fromISO(r.resumed_at).toJSDate() : null,
        foodTags: Array.isArray(r.food_tags) ? r.food_tags : [],
    }))
}