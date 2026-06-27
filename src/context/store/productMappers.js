import { getProductSupplierIds } from '../../lib/suppliers'

export function productToDb(p) {
  const { supplierId, supplierIds, ...rest } = p
  const ids = supplierIds?.length ? supplierIds : getProductSupplierIds(p)
  return { ...rest, supplierIds: ids }
}

export function productFromDb(r) {
  const supplierIds = getProductSupplierIds(r)
  const { supplierId, ...rest } = r
  return { ...rest, supplierIds }
}

export function mapProductsFromDb(rows) {
  return (rows || []).map(productFromDb)
}
