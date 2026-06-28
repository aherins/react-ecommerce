import { calcSupplierOrderTotal } from '../../lib/suppliers'

export function supplierOrderToDb(o) {
  const items = o.items || []
  return {
    id:           o.id,
    supplier_id:  o.supplierId,
    reference:    o.reference || null,
    status:       o.status || 'draft',
    items,
    total:        o.total ?? calcSupplierOrderTotal(items),
    notes:        o.notes || null,
    invoices:     o.invoices || [],
    created_at:   o.createdAt || new Date().toISOString(),
    expected_at:  o.expectedAt || null,
    received_at:  o.receivedAt || null,
    stock_locked_at: o.stockLockedAt || null,
  }
}

export function supplierOrderFromDb(r) {
  return {
    id:         r.id,
    supplierId: r.supplier_id,
    reference:  r.reference || '',
    status:     r.status,
    items:      r.items || [],
    total:      Number(r.total || 0),
    notes:      r.notes || '',
    invoices:   r.invoices || [],
    createdAt:  r.created_at,
    expectedAt: r.expected_at || null,
    receivedAt: r.received_at || null,
    stockLockedAt: r.stock_locked_at || null,
  }
}
