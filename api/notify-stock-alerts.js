import { adminHeaders, getSupabaseConfig, verifyAdminRole } from './supabaseAdmin.js'
import { getResendConfig, sendResendEmail } from './resendClient.js'
import { stockAlertHtml } from './emailTemplates.js'

export const config = { runtime: 'edge' }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { serviceKey, supabaseUrl } = getSupabaseConfig()
  if (!serviceKey || !supabaseUrl) {
    return json({ ok: true, skipped: true, reason: 'no_supabase' })
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const auth = await verifyAdminRole(token, supabaseUrl, serviceKey, ['superadmin', 'admin', 'editor'])
  if (!auth.ok) return json({ error: auth.error }, auth.status)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo JSON inválido.' }, 400)
  }

  const productId = String(body.productId || '')
  const productName = String(body.productName || 'Producto')
  const productPrice = Number(body.productPrice) || 0
  const image = String(body.image || '')

  if (!productId) return json({ error: 'productId requerido.' }, 400)

  const alertsRes = await fetch(
    `${supabaseUrl}/rest/v1/stock_alerts?product_id=eq.${encodeURIComponent(productId)}&notified_at=is.null&select=id,email`,
    { headers: adminHeaders(serviceKey) },
  )
  if (!alertsRes.ok) {
    const err = await alertsRes.text()
    return json({ error: `No se pudieron leer las alertas: ${err}` }, 500)
  }

  const alerts = await alertsRes.json()
  if (!alerts?.length) return json({ ok: true, sent: 0 })

  const { siteUrl, storeName } = getResendConfig()
  const productUrl = `${siteUrl}/producto/${productId}`
  const html = stockAlertHtml({ productName, productPrice, image, productUrl, storeName })

  let sent = 0
  const errors = []

  for (const alert of alerts) {
    try {
      const result = await sendResendEmail({
        to: alert.email,
        subject: `¡${productName} ya está disponible! — ${storeName}`,
        html,
      })
      if (result.skipped) {
        return json({ ok: true, skipped: true, sent: 0 })
      }

      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/stock_alerts?id=eq.${alert.id}`,
        {
          method: 'PATCH',
          headers: { ...adminHeaders(serviceKey), Prefer: 'return=minimal' },
          body: JSON.stringify({ notified_at: new Date().toISOString() }),
        },
      )
      if (!patchRes.ok) throw new Error('No se pudo marcar la alerta como enviada')
      sent++
    } catch (err) {
      errors.push({ email: alert.email, error: err.message })
    }
  }

  return json({ ok: true, sent, errors: errors.length ? errors : undefined })
}
