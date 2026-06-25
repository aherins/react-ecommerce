import { getSupabaseConfig } from './supabaseAdmin.js'
import { calcLineItems, applyCouponDiscount, fetchProductsForCheckout } from './checkoutCalc.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: 'STRIPE_SECRET_KEY no configurada.' }),
      { status: 500 },
    )
  }

  try {
    const body = await req.json()
    const { items, couponCode, currency = 'eur' } = body
    const { serviceKey, supabaseUrl } = getSupabaseConfig()

    let products = []
    if (serviceKey && supabaseUrl && items?.length) {
      products = await fetchProductsForCheckout(
        supabaseUrl,
        serviceKey,
        items.map(i => i.productId),
      )
    } else if (body.products?.length) {
      products = body.products
    } else {
      return new Response(JSON.stringify({ error: 'No se pudo validar el carrito.' }), { status: 400 })
    }

    const { lines, subtotal } = calcLineItems(items, products)

    let coupon = null
    if (couponCode && serviceKey && supabaseUrl) {
      const cRes = await fetch(
        `${supabaseUrl}/rest/v1/coupons?code=eq.${encodeURIComponent(couponCode)}&active=eq.true&select=*`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Accept: 'application/vnd.pgrst.object+json' } },
      )
      if (cRes.ok) coupon = await cRes.json()
    }

    const itemCount = lines.reduce((s, l) => s + l.qty, 0)
    const { discount } = applyCouponDiscount(subtotal, itemCount, coupon)
    const total = Math.max(0, subtotal - discount)
    const amount = Math.round(total * 100)

    if (amount < 50) {
      return new Response(JSON.stringify({ error: 'Importe mínimo no válido.' }), { status: 400 })
    }

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amount),
        currency,
        'automatic_payment_methods[enabled]': 'true',
        'metadata[subtotal]': String(subtotal),
        'metadata[discount]': String(discount),
      }),
    })

    const pi = await res.json()
    if (pi.error) {
      return new Response(JSON.stringify({ error: pi.error.message }), { status: 400 })
    }

    return new Response(JSON.stringify({
      clientSecret: pi.client_secret,
      amount,
      subtotal,
      discount,
      total,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
}
