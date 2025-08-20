// supabaseFoodLogs.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

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
        isUnfinished: !!r.is_unfinished,
        resumedAt: r.resumed_at ? DateTime.fromISO(r.resumed_at).toJSDate() : null,
        foodTags: Array.isArray(r.food_tags) ? r.food_tags : [],
    }))
}