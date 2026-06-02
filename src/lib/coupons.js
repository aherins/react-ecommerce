// ─────────────────────────────────────────────────────────────────────────────
//  SISTEMA DE CUPONES
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipos de cupón ────────────────────────────────────────────────────────────
export const COUPON_SCOPE = {
  GENERAL:  'general',   // cualquier usuario, usa-lo N veces
  PER_USER: 'per_user',  // cada usuario solo puede usarlo 1 vez
  SPECIFIC: 'specific',  // solo un usuario concreto (por email)
}

// ── Tipos de descuento ────────────────────────────────────────────────────────
export const DISCOUNT_TYPE = {
  PERCENT:   'percent',   // % sobre el subtotal
  FIXED:     'fixed',     // importe fijo en €
  FREE_SHIP: 'free_ship', // envío gratis (muestra 0 € en envío)
  BOGO:      'bogo',      // 2x1: el artículo más barato gratis
}

// ── Etiquetas legibles ────────────────────────────────────────────────────────
export const SCOPE_LABEL = {
  general:  'General',
  per_user: 'Uno por usuario',
  specific: 'Usuario específico',
}
export const DTYPE_LABEL = {
  percent:   '% Porcentaje',
  fixed:     '€ Cantidad fija',
  free_ship: '🚚 Envío gratis',
  bogo:      '2×1 Artículo más barato gratis',
}

// ── Datos semilla ─────────────────────────────────────────────────────────────
export const SEED_COUPONS = [
  {
    id: 'cp-1',
    code: 'BIENVENIDO10',
    description: '10% de descuento — bienvenida',
    scope: COUPON_SCOPE.PER_USER,
    specificEmail: null,
    discountType: DISCOUNT_TYPE.PERCENT,
    discountValue: 10,
    minAmount: 0,
    minItems: 0,
    maxUses: 500,
    usedCount: 3,
    usedBy: [],
    active: true,
    expiresAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cp-2',
    code: 'VERANO20',
    description: '20% en pedidos superiores a 80 €',
    scope: COUPON_SCOPE.GENERAL,
    specificEmail: null,
    discountType: DISCOUNT_TYPE.PERCENT,
    discountValue: 20,
    minAmount: 80,
    minItems: 0,
    maxUses: 50,
    usedCount: 12,
    usedBy: [],
    active: true,
    expiresAt: '2026-09-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cp-3',
    code: 'REGALO15',
    description: '15 € de descuento fijo',
    scope: COUPON_SCOPE.SPECIFIC,
    specificEmail: 'cliente@ejemplo.es',
    discountType: DISCOUNT_TYPE.FIXED,
    discountValue: 15,
    minAmount: 30,
    minItems: 0,
    maxUses: 1,
    usedCount: 0,
    usedBy: [],
    active: true,
    expiresAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cp-4',
    code: 'PACK3',
    description: '10% al comprar 3 o más unidades',
    scope: COUPON_SCOPE.GENERAL,
    specificEmail: null,
    discountType: DISCOUNT_TYPE.PERCENT,
    discountValue: 10,
    minAmount: 0,
    minItems: 3,
    maxUses: null,
    usedCount: 5,
    usedBy: [],
    active: true,
    expiresAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cp-5',
    code: 'ENVIOGRATIS',
    description: 'Envío gratuito en cualquier pedido',
    scope: COUPON_SCOPE.GENERAL,
    specificEmail: null,
    discountType: DISCOUNT_TYPE.FREE_SHIP,
    discountValue: 0,
    minAmount: 0,
    minItems: 0,
    maxUses: 100,
    usedCount: 0,
    usedBy: [],
    active: false,
    expiresAt: null,
    createdAt: new Date().toISOString(),
  },
]

// ── Generador de código aleatorio ─────────────────────────────────────────────
export function generateCode(prefix = '') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O,0,1,I para evitar confusión
  const rand  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return prefix ? `${prefix.toUpperCase()}-${rand}` : rand
}

// ── Calcular descuento ────────────────────────────────────────────────────────
export function computeDiscount(coupon, cartTotal, cart = [], products = []) {
  if (!coupon) return 0
  switch (coupon.discountType) {
    case DISCOUNT_TYPE.PERCENT:
      return parseFloat(((cartTotal * coupon.discountValue) / 100).toFixed(2))
    case DISCOUNT_TYPE.FIXED:
      return Math.min(parseFloat(coupon.discountValue), cartTotal)
    case DISCOUNT_TYPE.FREE_SHIP:
      return 0  // el envío ya es gratis; se marca visualmente
    case DISCOUNT_TYPE.BOGO: {
      // El artículo más barato del carrito es gratis
      const prices = cart
        .flatMap(i => Array(i.qty).fill(products.find(p => p.id === i.productId)?.price || 0))
        .sort((a, b) => a - b)
      return parseFloat((prices[0] || 0).toFixed(2))
    }
    default: return 0
  }
}

// ── Validar cupón ─────────────────────────────────────────────────────────────
export function validateCoupon({ coupon, cart = [], products = [], userEmail = null, usedCouponIds = [] }) {
  if (!coupon)         return { valid: false, error: 'Cupón no encontrado.' }
  if (!coupon.active)  return { valid: false, error: 'Este cupón no está activo.' }

  // Expiración
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
    return { valid: false, error: 'Este cupón ha caducado.' }

  // Límite global de usos
  if (coupon.maxUses !== null && coupon.maxUses !== '' && coupon.usedCount >= Number(coupon.maxUses))
    return { valid: false, error: 'Este cupón ha alcanzado el límite de usos.' }

  // Scope: per_user — cada usuario solo 1 vez
  if (coupon.scope === COUPON_SCOPE.PER_USER) {
    if (userEmail && (coupon.usedBy || []).includes(userEmail))
      return { valid: false, error: 'Ya has utilizado este cupón anteriormente.' }
  }

  // Scope: specific — solo el email concreto
  if (coupon.scope === COUPON_SCOPE.SPECIFIC) {
    if (!userEmail)
      return { valid: false, error: 'Este cupón es personal. Inicia sesión para usarlo.' }
    if (coupon.specificEmail?.toLowerCase() !== userEmail.toLowerCase())
      return { valid: false, error: 'Este cupón no es válido para tu cuenta.' }
  }

  // Importe mínimo
  const cartTotal = cart.reduce((s, i) => {
    const p = products.find(p => p.id === i.productId)
    return s + (p ? p.price * i.qty : 0)
  }, 0)

  if (coupon.minAmount > 0 && cartTotal < Number(coupon.minAmount))
    return {
      valid: false,
      error: `Importe mínimo: ${Number(coupon.minAmount).toFixed(2)} €. Te faltan ${(Number(coupon.minAmount) - cartTotal).toFixed(2)} €.`,
    }

  // Unidades mínimas
  const cartQty = cart.reduce((s, i) => s + i.qty, 0)
  if (coupon.minItems > 0 && cartQty < Number(coupon.minItems))
    return {
      valid: false,
      error: `Necesitas al menos ${coupon.minItems} unidades (tienes ${cartQty}).`,
    }

  const discount   = computeDiscount(coupon, cartTotal, cart, products)
  const finalTotal = Math.max(0, cartTotal - discount)
  const freeShip   = coupon.discountType === DISCOUNT_TYPE.FREE_SHIP

  return { valid: true, discount, finalTotal, freeShip, cartTotal }
}
