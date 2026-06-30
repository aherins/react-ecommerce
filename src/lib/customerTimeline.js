const EVENT_LABELS = {
  product_view: 'Vió producto',
  search: 'Búsqueda',
  add_to_cart: 'Añadió al carrito',
  wishlist_add: 'Añadió a deseos',
  wishlist_remove: 'Quitó de deseos',
}

export function buildCustomerTimeline({ orders = [], notes = [], events = [] }) {
  const items = []

  orders.forEach(o => {
    items.push({
      id: `order-${o.id}`,
      type: 'order',
      at: o.created_at,
      order: o,
    })
  })

  notes.forEach(n => {
    items.push({
      id: `note-${n.id}`,
      type: 'note',
      at: n.created_at,
      note: n,
    })
  })

  events.forEach(e => {
    items.push({
      id: `event-${e.id}`,
      type: 'event',
      at: e.created_at,
      event: e,
    })
  })

  return items.sort((a, b) => new Date(b.at) - new Date(a.at))
}

export function getTimelineEventLabel(event) {
  return EVENT_LABELS[event?.event_type] || event?.event_type
}

export function buildProductViewStats(viewEvents, productById = {}) {
  const byProduct = {}

  for (const e of viewEvents || []) {
    if (!e.product_id) continue
    if (!byProduct[e.product_id]) {
      byProduct[e.product_id] = { count: 0, last_viewed_at: e.created_at }
    }
    byProduct[e.product_id].count += 1
    if (e.created_at > byProduct[e.product_id].last_viewed_at) {
      byProduct[e.product_id].last_viewed_at = e.created_at
    }
  }

  return Object.entries(byProduct)
    .map(([product_id, { count, last_viewed_at }]) => ({
      product_id,
      count,
      last_viewed_at,
      product: productById[product_id] || null,
    }))
    .sort((a, b) => b.count - a.count || new Date(b.last_viewed_at) - new Date(a.last_viewed_at))
}

export function reconstructWishlistFromEvents(eventRows) {
  const state = new Map()
  const sorted = [...(eventRows || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  )
  for (const e of sorted) {
    if (!e.product_id) continue
    if (e.event_type === 'wishlist_add') {
      state.set(e.product_id, { added_at: e.created_at })
    } else if (e.event_type === 'wishlist_remove') {
      state.delete(e.product_id)
    }
  }
  return dedupeWishlist(
    [...state.entries()].map(([product_id, meta]) => ({
      product_id,
      added_at: meta.added_at,
    })),
  )
}

function dedupeWishlist(items) {
  const byId = new Map()
  for (const w of items || []) {
    if (!w?.product_id) continue
    if (!byId.has(w.product_id)) byId.set(w.product_id, w)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0),
  )
}

export function mergeWishlistSources(dbItems, eventRows) {
  const fromDb = dedupeWishlist(dbItems)
  const fromEvents = reconstructWishlistFromEvents(eventRows)
  if (!eventRows?.length) return fromDb
  if (!fromDb.length) return fromEvents
  const hasRemoves = eventRows.some(e => e.event_type === 'wishlist_remove')
  return hasRemoves ? fromEvents : fromDb
}

export { EVENT_LABELS }
