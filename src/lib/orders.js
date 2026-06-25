export const ORDER_STATUS_LABEL = {
  pending: 'Pendiente',
  processing: 'En preparación',
  shipped: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

/** Pedidos que pertenecen al usuario autenticado */
export function ordersForUser(orders, user) {
  if (!user) return []
  const email = user.email?.toLowerCase()
  return (orders || []).filter(o =>
    o.userId === user.id ||
    (email && o.email?.toLowerCase() === email)
  )
}
