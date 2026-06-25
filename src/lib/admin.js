export const ORDER_STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export const ORDER_STATUS_LABEL = {
  pending: 'Pendiente',
  processing: 'En preparación',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLOR = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

export function sortOrdersByDate(orders) {
  return [...(orders || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )
}

export function countUniqueCustomers(orders) {
  const emails = new Set(
    (orders || [])
      .map(o => o.email?.toLowerCase())
      .filter(Boolean)
  )
  return emails.size
}

export function exportOrdersCsv(orders) {
  const sorted = sortOrdersByDate(orders)
  const header = ['id', 'fecha', 'email', 'estado', 'total', 'simulado', 'seguimiento']
  const rows = sorted.map(o => [
    o.id,
    o.createdAt ? new Date(o.createdAt).toISOString() : '',
    o.email || '',
    o.status || '',
    o.total ?? '',
    o.simulated ? 'si' : 'no',
    o.trackingNumber || '',
  ])
  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
