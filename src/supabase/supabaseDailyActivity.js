// supabaseDailyActivity.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'

function asDate(v) { return v instanceof Date ? v : new Date(v) }

/**
 * Fetch daily_activity rows for Sydney-local date window [start, end) by sydney_date.
 * start/end are JS Dates; filtering uses 'yyyy-LL-dd' strings.
 */
export async function fetchDailyActivityBetween(startDate, endDate, tz = 'Australia/Sydney') {
    const startStr = DateTime.fromJSDate(asDate(startDate), { zone: tz }).toFormat('yyyy-LL-dd')
    const endStr   = DateTime.fromJSDate(asDate(endDate),   { zone: tz }).toFormat('yyyy-LL-dd')

    const { data, error } = await supabase
        .from('daily_activity')
        .select('sydney_date, active_calories, resting_calories, total_calories, exercise_minutes')
        .gte('sydney_date', startStr)
        .lt('sydney_date', endStr)
        .order('sydney_date', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        sydney_date: r.sydney_date, // 'yyyy-LL-dd' Sydney-local
        active_calories: r.active_calories == null ? null : Number(r.active_calories),
        resting_calories: r.resting_calories == null ? null : Number(r.resting_calories),
        total_calories: r.total_calories == null ? null : Number(r.total_calories),
        exercise_minutes: r.exercise_minutes == null ? null : Number(r.exercise_minutes),
    }))
}