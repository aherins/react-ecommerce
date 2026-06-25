export function calcLineItems(items, products) {
  const lines = []
  let subtotal = 0

  for (const { productId, qty } of items || []) {
    const product = products.find(p => p.id === productId)
    if (!product || !product.active) throw new Error(`Producto no disponible: ${productId}`)
    if (qty < 1) continue
    if (product.stock < qty) throw new Error(`Stock insuficiente para «${product.name}»`)
    const lineTotal = product.price * qty
    subtotal += lineTotal
    lines.push({
      productId,
      qty,
      price: product.price,
      name: product.name,
    })
  }

  if (!lines.length) throw new Error('El carrito está vacío.')
  return { lines, subtotal }
}

export function applyCouponDiscount(subtotal, itemCount, coupon) {
  if (!coupon) return { discount: 0, freeShip: false }

  let discount = 0
  let freeShip = false

  if (coupon.min_amount && subtotal < coupon.min_amount) {
    throw new Error(`Pedido mínimo de ${coupon.min_amount} € para este cupón`)
  }
  if (coupon.min_items && itemCount < coupon.min_items) {
    throw new Error(`Mínimo ${coupon.min_items} artículos para este cupón`)
  }

  switch (coupon.discount_type) {
    case 'percent':
      discount = subtotal * (coupon.discount_value / 100)
      break
    case 'fixed':
      discount = Math.min(coupon.discount_value, subtotal)
      break
    case 'free_ship':
      freeShip = true
      break
    case 'bogo':
      discount = subtotal * 0.5
      break
    default:
      break
  }

  return { discount: Math.round(discount * 100) / 100, freeShip }
}

export async function fetchProductsForCheckout(supabaseUrl, serviceKey, productIds) {
  const ids = [...new Set(productIds)].map(id => `"${id}"`).join(',')
  const res = await fetch(
    `${supabaseUrl}/rest/v1/products?id=in.(${ids})&select=id,name,price,stock,active`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  )
  if (!res.ok) throw new Error('No se pudo validar el carrito.')
  return res.json()
}
