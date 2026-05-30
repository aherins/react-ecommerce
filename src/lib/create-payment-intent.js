// api/create-payment-intent.js
// Vercel Serverless Function — se ejecuta en el servidor, nunca expone STRIPE_SECRET_KEY al cliente

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: 'STRIPE_SECRET_KEY no configurada en variables de entorno.' }),
      { status: 500 }
    )
  }

  try {
    const { amount, currency = 'eur' } = await req.json()

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amount),
        currency,
        'automatic_payment_methods[enabled]': 'true',
      }),
    })

    const pi = await res.json()

    if (pi.error) {
      return new Response(JSON.stringify({ error: pi.error.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ clientSecret: pi.client_secret }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}