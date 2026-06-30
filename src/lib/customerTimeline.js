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

export { EVENT_LABELS }
