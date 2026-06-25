export function getCartQty(cart, productId) {
  return cart.find(i => i.productId === productId)?.qty ?? 0
}

export function canAddToCart(product, cart) {
  if (!product || product.stock <= 0) return false
  return getCartQty(cart, product.id) < product.stock
}

export function clampQty(product, qty) {
  if (!product) return 0
  return Math.min(Math.max(0, qty), product.stock)
}

/** Devuelve mensaje si el carrito supera el stock disponible */
export function validateCartStock(cart, products) {
  for (const item of cart) {
    const product = products.find(p => p.id === item.productId)
    if (!product) return 'Hay productos en el carrito que ya no existen.'
    if (item.qty > product.stock) {
      return `"${product.name}" solo tiene ${product.stock} unidad${product.stock === 1 ? '' : 'es'} disponible${product.stock === 1 ? '' : 's'}.`
    }
  }
  return null
}
