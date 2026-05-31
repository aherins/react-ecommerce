import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const key    = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Limpiar la URL: quitar /rest/v1/ u otros paths si el usuario los pegó por error
const url = rawUrl.replace(/\/(rest\/v1\/?|auth\/v1\/?)$/, '').replace(/\/$/, '')

export const hasSupabase = Boolean(url && key && url.includes('supabase.co'))

export const supabase = hasSupabase
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
