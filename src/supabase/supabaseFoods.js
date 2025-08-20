// supabaseFoods.js
import { supabase } from './supabase'

/**
 * Fetch all foods (no date filter).
 * Columns: id (uuid), name (text), tags (text[]).
 */
export async function fetchAllFoods() {
    const { data, error } = await supabase
        .from('foods')
        .select('id, name, tags')
        .order('name', { ascending: true })

    if (error) throw error

    return (data ?? []).map(r => ({
        id: r.id,
        name: r.name ?? '',
        tags: Array.isArray(r.tags) ? r.tags : [],
    }))
}