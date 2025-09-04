// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Environment variables (from .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)