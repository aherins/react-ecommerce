import { supabase, hasSupabase } from './supabase'
import { loadLocal, saveLocal } from '../context/store/helpers'

const DEMO_KEY = 'stock_alerts'
const LOCAL_PREFIX = 'stock_alert_sub_'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function demoAlerts() {
  return loadLocal(DEMO_KEY) || []
}

function saveDemoAlerts(alerts) {
  saveLocal(DEMO_KEY, alerts)
}

function markLocalSub(productId, email) {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${productId}`, email)
  } catch {}
}

function getLocalSub(productId) {
  try {
    return localStorage.getItem(`${LOCAL_PREFIX}${productId}`) || ''
  } catch {
    return ''
  }
}

function clearLocalSub(productId) {
  try {
    localStorage.removeItem(`${LOCAL_PREFIX}${productId}`)
  } catch {}
}

export async function checkStockAlert(productId, email) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  if (!hasSupabase) {
    return demoAlerts().some(a => a.productId === productId && a.email === normalized)
      || getLocalSub(productId) === normalized
  }

  if (getLocalSub(productId) === normalized) return true

  const { data, error } = await supabase
    .from('stock_alerts')
    .select('id')
    .eq('product_id', productId)
    .ilike('email', normalized)
    .maybeSingle()

  if (error) {
    console.warn('checkStockAlert:', error.message)
    return getLocalSub(productId) === normalized
  }
  return Boolean(data)
}

export async function subscribeStockAlert({ productId, email, userId }) {
  const normalized = normalizeEmail(email)
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'Introduce un email válido.' }
  }

  if (!hasSupabase) {
    const alerts = demoAlerts()
    const exists = alerts.some(a => a.productId === productId && a.email === normalized)
    if (!exists) {
      saveDemoAlerts([
        ...alerts,
        { productId, email: normalized, userId: userId || null, createdAt: new Date().toISOString() },
      ])
    }
    markLocalSub(productId, normalized)
    return { ok: true, already: exists }
  }

  const { error } = await supabase.from('stock_alerts').upsert(
    {
      product_id: productId,
      email: normalized,
      user_id: userId || null,
      notified_at: null,
    },
    { onConflict: 'product_id,email' },
  )

  if (error) return { ok: false, error: error.message }
  markLocalSub(productId, normalized)
  return { ok: true }
}

export async function unsubscribeStockAlert({ productId, email }) {
  const normalized = normalizeEmail(email)
  if (!normalized) return { ok: false, error: 'Email no válido.' }

  if (!hasSupabase) {
    saveDemoAlerts(demoAlerts().filter(a => !(a.productId === productId && a.email === normalized)))
    clearLocalSub(productId)
    return { ok: true }
  }

  const { error } = await supabase
    .from('stock_alerts')
    .delete()
    .eq('product_id', productId)
    .ilike('email', normalized)

  if (error) return { ok: false, error: error.message }
  clearLocalSub(productId)
  return { ok: true }
}

export async function fetchStockAlertCounts(productIds) {
  if (!productIds?.length) return {}

  if (!hasSupabase) {
    const alerts = demoAlerts()
    return productIds.reduce((acc, id) => {
      acc[id] = alerts.filter(a => a.productId === id).length
      return acc
    }, {})
  }

  const { data, error } = await supabase
    .from('stock_alerts')
    .select('product_id')
    .in('product_id', productIds)
    .is('notified_at', null)

  if (error) {
    console.warn('fetchStockAlertCounts:', error.message)
    return {}
  }

  return (data || []).reduce((acc, row) => {
    acc[row.product_id] = (acc[row.product_id] || 0) + 1
    return acc
  }, {})
}

export function getLocalAlertEmail(productId) {
  return getLocalSub(productId)
}
