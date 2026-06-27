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

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
