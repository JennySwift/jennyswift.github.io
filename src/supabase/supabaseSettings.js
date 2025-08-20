import { supabase } from './supabase'

export async function fetchPumpUploadTime() {
    const { data, error } = await supabase
        .from('app_settings')
        .select('pump_upload_time')
        .eq('id', 1)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    const iso = data?.pump_upload_time ?? null
    return { pumpUploadTime: iso ? new Date(iso) : null }
}