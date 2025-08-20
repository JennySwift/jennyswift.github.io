// supabaseWorkouts.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

/**
 * Fetch all workouts that overlap the selected Sydney day.
 * Overlap condition:
 *   (start_time < endOfDayUTC) AND (end_time IS NULL OR end_time > startOfDayUTC)
 */
export async function fetchWorkoutsForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) {
        throw new Error('fetchWorkoutsForDay: date is invalid')
    }

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    const { data, error } = await supabase
        .from('workouts')
        .select(`
      id,
      start_time,
      end_time,
      elapsed_time,
      duration,
      type,
      name,
      notes,
      distance,
      active_calories,
      average_heart_rate,
      max_heart_rate,
      minutes_per_km,
      km_per_hour,
      tags
    `)
        .lt('start_time', endUtcISO)
        .or(`end_time.is.null,end_time.gt.${startUtcISO}`)
        .order('start_time', { ascending: true })

    if (error) throw error

    return (data ?? []).map(w => ({
        id: w.id,
        start: DateTime.fromISO(w.start_time).toJSDate(),
        endTime: w.end_time ? DateTime.fromISO(w.end_time).toJSDate() : null,
        elapsedTime: Number(w.elapsed_time ?? 0),
        duration: Number(w.duration ?? 0),
        type: String(w.type ?? ''),
        name: String(w.name ?? ''),
        notes: String(w.notes ?? ''),
        distance: Number(w.distance ?? 0),
        activeCalories: Number(w.active_calories ?? 0),
        averageHeartRate: Number(w.average_heart_rate ?? 0),
        maxHeartRate: Number(w.max_heart_rate ?? 0),
        minutesPerKm: Number(w.minutes_per_km ?? 0),
        kmPerHour: Number(w.km_per_hour ?? 0),
        tags: String(w.tags ?? ''),
    }))
}