import { getResendConfig, sendResendEmail } from './resendClient.js'
import { orderConfirmationHtml } from './emailTemplates.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { to, orderId, items, total, simulated } = await req.json()
    const { storeName } = getResendConfig()

    const html = orderConfirmationHtml({ orderId, items, total, simulated, storeName })
    const result = await sendResendEmail({
      to,
      subject: `Confirmación de pedido — ${storeName} #${orderId.slice(-8).toUpperCase()}`,
      html,
    })

    if (result.skipped) {
      console.warn('RESEND_API_KEY no configurada — email no enviado')
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
