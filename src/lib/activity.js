// ─── Gestión del historial de actividad del usuario ───────────────────────────
// localStorage + sincronización opcional con Supabase si hay sesión

import { customerSync } from './customerSync'

const MAX_ITEMS = 20

function getStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function setStore(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

function pushUnique(key, id) {
  const list = getStore(key).filter(i => i !== id)
  list.unshift(id)
  setStore(key, list.slice(0, MAX_ITEMS))
}

export const activity = {
  trackView(productId, userId) {
    pushUnique('activity_viewed', productId)
    if (userId) customerSync.trackEvent(userId, 'product_view', productId)
  },

  trackCartAdd(productId, userId) {
    pushUnique('activity_carted', productId)
    if (userId) customerSync.trackEvent(userId, 'add_to_cart', productId)
  },

  trackSearch(query, userId) {
    if (!query?.trim()) return
    const q = query.trim()
    const searches = getStore('activity_searches').filter(s => s !== q)
    searches.unshift(q)
    setStore('activity_searches', searches.slice(0, 10))
    if (userId) customerSync.trackEvent(userId, 'search', null, { query: q })
  },

  trackWishlist(productId, added, userId) {
    if (userId) {
      customerSync.trackEvent(userId, added ? 'wishlist_add' : 'wishlist_remove', productId)
    }
  },

  getViewed()   { return getStore('activity_viewed')   },
  getCarted()   { return getStore('activity_carted')   },
  getSearches() { return getStore('activity_searches') },

  // Combina vistos + añadidos al carrito sin duplicados
  getAll() {
    const viewed  = getStore('activity_viewed')
    const carted  = getStore('activity_carted')
    const all     = [...new Set([...carted, ...viewed])] // carted primero = más relevante
    return all
  },

  clear() {
    localStorage.removeItem('activity_viewed')
    localStorage.removeItem('activity_carted')
    localStorage.removeItem('activity_searches')
  },
}
