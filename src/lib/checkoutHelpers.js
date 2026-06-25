export async function sendOrderConfirmation(order, lineItems) {
  if (!order?.email) return
  try {
    await fetch('/api/send-order-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: order.email,
        orderId: order.id,
        items: lineItems.map(i => ({
          name: i.product?.name || 'Producto',
          qty: i.qty,
          price: i.product?.price || 0,
        })),
        total: order.total,
        simulated: order.simulated,
      }),
    })
  } catch (e) {
    console.warn('Email de pedido no enviado:', e.message)
  }
}

const COUPON_STORAGE_KEY = 'checkout_applied_coupon'

export function loadSavedCoupon() {
  try {
    const raw = localStorage.getItem(COUPON_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveCoupon(applied) {
  if (applied) localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(applied))
  else localStorage.removeItem(COUPON_STORAGE_KEY)
}

export const EMPTY_SHIPPING = {
  email: '',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: 'ES',
}

export function validateShipping(shipping, user) {
  const email = (user?.email || shipping.email || '').trim()
  if (!email || !email.includes('@')) return 'Introduce un email válido.'
  if (!shipping.fullName?.trim()) return 'Introduce el nombre completo.'
  if (!shipping.line1?.trim()) return 'Introduce la dirección de envío.'
  if (!shipping.city?.trim()) return 'Introduce la ciudad.'
  if (!shipping.postalCode?.trim()) return 'Introduce el código postal.'
  return null
}
