import { loadStripe } from '@stripe/stripe-js'

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

// stripePromise es null si no hay clave → se usa modo simulación
export const stripePromise = key ? loadStripe(key) : null
export const hasStripe = Boolean(key)

// ─── Modo Simulación ──────────────────────────────────────────────────────────
// Simula el flujo completo: validación de tarjeta, éxito/fallo, delay visual

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