//supabaseNotes.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'
import { sydneyDayRangeUtcISO } from '../helpers/dateHelpers'

/**
 * Daily notes: match by start_time only (ignore end_time for now).
 * start_time >= startOfDay AND start_time < endOfDay
 */
export async function fetchNotesForDay(date) {
    const base = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(base.getTime())) {
        throw new Error('fetchNotesForDay: date is invalid')
    }

    const { startUtcISO, endUtcISO } = sydneyDayRangeUtcISO(base)

    const { data, error } = await supabase
        .from('notes')
        .select('id, text, start_time, end_time, tags')
        .gte('start_time', startUtcISO)
        .lt('start_time', endUtcISO)
        .order('start_time', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        id: r.id,
        text: r.text ?? '',
        // keep both for future; UI uses `timestamp` today
        timestamp: DateTime.fromISO(r.start_time).toJSDate(),
        startTime: DateTime.fromISO(r.start_time).toJSDate(),
        endTime: r.end_time ? DateTime.fromISO(r.end_time).toJSDate() : null,
        tags: Array.isArray(r.tags) ? r.tags : [],
    }))
}

/**
 * All-notes, paginated + server-side filter.
 * Uses keyset pagination; `anchor` = { startISO, id } from the last item of the previous page.
 */
export async function filterAllNotesWithPagination({
                                                       limit = 10,
                                                       anchor,          // { startISO: string, id: string } | null
                                                       query = '',
                                                       tags = [],
                                                   } = {}) {
    let q = supabase
        .from('notes')
        .select('id, text, start_time, end_time, tags', { count: 'exact' })
        .order('start_time', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit)

    if (anchor?.startISO && anchor?.id) {
        q = q.or(
            [
                `and(start_time.lt.${anchor.startISO})`,
                `and(start_time.eq.${anchor.startISO},id.lt.${anchor.id})`,
            ].join(',')
        )
    }

    const cleanQuery = (query || '').trim()
    const cleanTags = (Array.isArray(tags) ? tags : [])
        .map(s => String(s).trim()).filter(Boolean)

    if (cleanQuery.startsWith('#')) {
        const tag = cleanQuery.slice(1).trim()
        if (tag) cleanTags.push(tag)
    } else if (cleanQuery.length > 0) {
        q = q.ilike('text', `%${cleanQuery}%`)
    }

    if (cleanTags.length > 0) {
        q = q.contains('tags', cleanTags) // AND semantics on array column
    }

    const { data, error } = await q
    if (error) throw error

    const items = (data ?? []).map(r => ({
        id: r.id,
        text: r.text ?? '',
        timestamp: DateTime.fromISO(r.start_time).toJSDate(),
        startTime: DateTime.fromISO(r.start_time).toJSDate(),
        endTime: r.end_time ? DateTime.fromISO(r.end_time).toJSDate() : null,
        tags: Array.isArray(r.tags) ? r.tags : [],
    }))

    const last = items[items.length - 1]
    const nextAnchor = last
        ? { startISO: DateTime.fromJSDate(last.startTime).toISO(), id: last.id }
        : null

    return { items, nextAnchor }
}

export async function fetchAllNoteTags() {
    const { data, error } = await supabase.rpc('all_note_tags')
    if (error) throw error
    return (data ?? []).map(r => r.tag)
}