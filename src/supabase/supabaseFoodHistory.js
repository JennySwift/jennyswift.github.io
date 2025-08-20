// supabaseFoodHistory.js
import { DateTime } from 'luxon'
import { supabase } from './supabase'

// Paginated food history from DB (server-side filter + keyset pagination)
export async function filterFoodLogsHistoryPaginated({
                                                         limit = 20,
                                                         anchor,               // { tsISO: string, id: string } | null
                                                         foodName = '',        // exact name chosen from your JSON list
                                                         tags = [],            // AND filter; logs must contain all these tags
                                                     } = {}) {
    let q = supabase
        .from('food_logs')
        .select(
            'id, timestamp, food_name, quantity, net_carbs, calories, fat, protein, total_carbs, fibre, is_unfinished, resumed_at, food_tags',
            { count: 'exact' }
        )
        .order('timestamp', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit)

    if (anchor?.tsISO && anchor?.id) {
        q = q.or([
            `and(timestamp.lt.${anchor.tsISO})`,
            `and(timestamp.eq.${anchor.tsISO},id.lt.${anchor.id})`,
        ].join(','))
    }

    const cleanName = (foodName || '').trim()
    if (cleanName) q = q.ilike('food_name', cleanName) // case-insensitive “equals” (no wildcards)

    const cleanTags = (Array.isArray(tags) ? tags : [])
        .map(s => String(s).trim()).filter(Boolean)
    if (cleanTags.length > 0) q = q.contains('food_tags', cleanTags)

    const { data, error, count } = await q
    if (error) throw error

    const items = (data ?? []).map(r => ({
        id: r.id,
        timestamp: DateTime.fromISO(r.timestamp).toJSDate(),
        foodName: r.food_name ?? '',
        quantity: Number(r.quantity ?? 0),
        netCarbs: Number(r.net_carbs ?? 0),
        calories: Number(r.calories ?? 0),
        fat: Number(r.fat ?? 0),
        protein: Number(r.protein ?? 0),
        totalCarbs: Number(r.total_carbs ?? 0),
        fibre: Number(r.fibre ?? 0),
        isUnfinished: Boolean(r.is_unfinished),
        resumedAt: r.resumed_at ? DateTime.fromISO(r.resumed_at).toJSDate() : null,
        foodTags: Array.isArray(r.food_tags) ? r.food_tags : [],
    }))

    const last = items[items.length - 1]
    const nextAnchor = last
        ? { tsISO: DateTime.fromJSDate(last.timestamp).toISO(), id: last.id }
        : null

    return { items, nextAnchor, totalMatchingFilter: count ?? null }
}

// Summary numbers across ALL matches (not just the current page)
export async function fetchFoodHistorySummary({ foodName = '', tags = [] } = {}) {
    const { data, error } = await supabase.rpc('food_history_summary', {
        p_food_name: (foodName || '').trim() || null,
        p_tags: (Array.isArray(tags) && tags.length) ? tags : null,
    })
    if (error) throw error

    const row = (data ?? [])[0]
    if (!row) return { totalQuantity: 0, totalCount: 0, durationDays: 0, averagePerDay: 0 }

    const minTs = row.min_ts ? DateTime.fromISO(row.min_ts) : null
    const maxTs = row.max_ts ? DateTime.fromISO(row.max_ts) : null
    const totalQuantity = Number(row.total_qty ?? 0)
    const totalCount = Number(row.total_count ?? 0)

    let durationDays = 0
    if (minTs && maxTs) {
        const spanMs = Math.max(0, maxTs.toMillis() - minTs.toMillis())
        durationDays = Math.max(1, Math.ceil(spanMs / (24 * 3600 * 1000)))
    }
    const averagePerDay = durationDays ? (totalQuantity / durationDays) : 0

    return { totalQuantity, totalCount, durationDays, averagePerDay }
}