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

export { EVENT_LABELS }
