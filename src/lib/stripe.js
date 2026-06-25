import { loadStripe } from '@stripe/stripe-js'

const rawKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim()

/** Claves de ejemplo o incompletas → modo simulación */
function isConfiguredStripeKey(key) {
  if (!key) return false
  if (/tu_clave|your_|placeholder|xxx|example|changeme/i.test(key)) return false
  return /^pk_(test|live)_[a-zA-Z0-9]{14,}$/.test(key)
}

export const hasStripe = isConfiguredStripeKey(rawKey)
export const stripePromise = hasStripe ? loadStripe(rawKey) : null

/** Comprueba si el backend tiene STRIPE_SECRET_KEY configurada */
export async function checkStripeBackend() {
  if (!hasStripe) return false
  try {
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100, currency: 'eur' }),
    })
    const data = await res.json()
    if (data.error?.includes('STRIPE_SECRET_KEY')) return false
    return res.ok && Boolean(data.clientSecret)
  } catch {
    return false
  }
}

// ─── Modo Simulación ──────────────────────────────────────────────────────────

export const MOCK_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Visa — pago exitoso',   result: 'success' },
  { number: '4000 0000 0000 0002', label: 'Visa — pago rechazado', result: 'declined' },
  { number: '4000 0025 0000 3155', label: 'Visa — requiere 3D Secure', result: 'secure-3ds' },
]

export async function simulatePayment({ card, delay = 1800 }) {
  await new Promise(r => setTimeout(r, delay))
  if (card === '4000 0000 0000 0002') throw new Error('Tu tarjeta fue rechazada.')
  if (card === '4000 0025 0000 3155') throw new Error('Tu banco requiere autenticación adicional (3D Secure).')
  return { id: `sim_${Date.now()}`, status: 'succeeded' }
}
