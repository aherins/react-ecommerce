export const SUPPLIER_ORDER_STATUS = {
  draft: 'Borrador',
  sent: 'Enviado',
  received: 'Recibido',
  cancelled: 'Cancelado',
}

export const SUPPLIER_ORDER_STATUS_OPTIONS = ['draft', 'sent', 'received', 'cancelled']

export function getProductSupplierIds(product) {
  if (product?.supplierIds?.length) return product.supplierIds
  if (product?.supplierId) return [product.supplierId]
  return []
}

export function productSuppliesFrom(supplierId, products) {
  return (products || []).filter(p => getProductSupplierIds(p).includes(supplierId))
}

export function calcSupplierOrderTotal(items) {
  return (items || []).reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
}

export function isSupplierOrderLocked(order) {
  return Boolean(order?.stockLockedAt)
}

export function canApplyStockToLine(order, lineIndex) {
  if (!order || order.status !== 'received' || isSupplierOrderLocked(order)) return false
  const line = order.items?.[lineIndex]
  return Boolean(line?.productId && !line.stockAppliedAt)
}

export function applyStockToSupplierOrderLine(order, lineIndex, products) {
  if (!canApplyStockToLine(order, lineIndex)) return null

  const line = order.items[lineIndex]
  const product = (products || []).find(p => p.id === line.productId)
  if (!product) return null

  const now = new Date().toISOString()
  const updatedItems = order.items.map((item, i) => (
    i === lineIndex ? { ...item, stockAppliedAt: now } : item
  ))
  const allApplied = updatedItems.every(item => item.stockAppliedAt)

  return {
    order: {
      ...order,
      items: updatedItems,
      stockLockedAt: allApplied ? now : order.stockLockedAt || null,
    },
    product: { ...product, stock: (product.stock || 0) + line.qty },
    line,
    prevStock: product.stock || 0,
  }
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
