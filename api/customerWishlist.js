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

/** Estado actual: BD primero; eventos si BD vacía o hay bajadas registradas. */
export function mergeWishlistSources(dbItems, eventRows) {
  const fromDb = dedupeWishlist(dbItems)
  const fromEvents = reconstructWishlistFromEvents(eventRows)
  if (!eventRows?.length) return fromDb
  if (!fromDb.length) return fromEvents
  const hasRemoves = eventRows.some(e => e.event_type === 'wishlist_remove')
  return hasRemoves ? fromEvents : fromDb
}
