export function validateSupplierOrderForm(form) {
  const errors = {}

  if (!form?.supplierId) {
    errors.supplierId = 'Selecciona un proveedor.'
  }

  const items = form?.items || []
  const validLines = items.filter(i => i.productId && Number(i.qty) > 0)

  if (validLines.length === 0) {
    errors.items = 'Añade al menos una línea con producto y cantidad.'
  }

  const lineItems = {}
  items.forEach((line, idx) => {
    const lineErr = {}
    const hasProduct = Boolean(line.productId)
    const qty = Number(line.qty)
    const hasQty = line.qty !== '' && !Number.isNaN(qty)

    if (!hasProduct && (hasQty || line.unitCost)) {
      lineErr.productId = 'Elige un producto.'
    }
    if (hasProduct && (!hasQty || qty <= 0)) {
      lineErr.qty = 'Indica una cantidad de al menos 1.'
    }
    if (hasProduct && line.unitCost !== '' && Number(line.unitCost) < 0) {
      lineErr.unitCost = 'El coste no puede ser negativo.'
    }

    if (Object.keys(lineErr).length) lineItems[idx] = lineErr
  })

  if (Object.keys(lineItems).length) errors.lineItems = lineItems

  return {
    errors,
    valid: Object.keys(errors).length === 0,
  }
}
