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
  return [...state.entries()].map(([product_id, meta]) => ({
    product_id,
    added_at: meta.added_at,
  }))
}

export function mergeWishlistSources(dbItems, eventRows) {
  const eventProductIds = new Set(
    (eventRows || []).map(e => e.product_id).filter(Boolean),
  )
  const fromEvents = reconstructWishlistFromEvents(eventRows)
  const byId = new Map(fromEvents.map(w => [w.product_id, w]))
  for (const w of dbItems || []) {
    if (!eventProductIds.has(w.product_id)) {
      byId.set(w.product_id, w)
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0),
  )
}
