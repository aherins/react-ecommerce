// ─── Gestión del historial de actividad del usuario ───────────────────────────
// Almacenado en localStorage — sin necesidad de autenticación

const MAX_ITEMS = 20

function getStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function setStore(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// Añade un id a una lista, sin duplicados, máximo MAX_ITEMS
function pushUnique(key, id) {
  const list = getStore(key).filter(i => i !== id)
  list.unshift(id)
  setStore(key, list.slice(0, MAX_ITEMS))
}

export const activity = {
  // Producto visto (llamar en ProductDetail al montar)
  trackView(productId) {
    pushUnique('activity_viewed', productId)
  },

  // Producto añadido al carrito alguna vez
  trackCartAdd(productId) {
    pushUnique('activity_carted', productId)
  },

  // Búsqueda realizada
  trackSearch(query) {
    if (!query?.trim()) return
    const searches = getStore('activity_searches').filter(q => q !== query.trim())
    searches.unshift(query.trim())
    setStore('activity_searches', searches.slice(0, 10))
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
