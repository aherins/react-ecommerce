// api/send-order-email.js
// Vercel Serverless Function — envía email de confirmación de pedido con Resend

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey  = process.env.RESEND_API_KEY
  const from    = process.env.RESEND_FROM || 'pedidos@artesana.es'

  if (!apiKey) {
    // Sin Resend configurado → responder OK silenciosamente (no bloquear el flujo)
    console.warn('RESEND_API_KEY no configurada — email no enviado')
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { to, orderId, items, total, simulated } = await req.json()

    const itemsHtml = items.map(i =>
      `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb">${i.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center">× ${i.qty}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right">${(i.price * i.qty).toFixed(2)} €</td>
      </tr>`
    ).join('')

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f5f2ee;font-family:'DM Sans',Arial,sans-serif">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #d4cfc9">
          <div style="background:#0f0e0d;padding:28px 32px">
            <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:0.12em;color:#f5f2ee">ARTESANA</p>
          </div>
          <div style="padding:32px">
            <h1 style="margin:0 0 8px;font-size:24px;color:#0f0e0d">¡Pedido confirmado!</h1>
            <p style="color:#8a8680;margin:0 0 24px">Gracias por tu compra. Aquí tienes el resumen.</p>

            ${simulated ? '<p style="background:#fef9c3;border:1px solid #fde68a;padding:8px 12px;border-radius:4px;font-size:13px;color:#92400e">⚡ Pago simulado — no se ha cargado ningún importe real.</p>' : ''}

            <p style="font-size:13px;color:#8a8680;margin:0 0 16px">Ref: <code style="background:#f5f2ee;padding:2px 6px;border-radius:4px">${orderId}</code></p>

            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a8680;padding-bottom:8px;border-bottom:2px solid #d4cfc9">Producto</th>
                  <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a8680;padding-bottom:8px;border-bottom:2px solid #d4cfc9">Cant.</th>
                  <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8a8680;padding-bottom:8px;border-bottom:2px solid #d4cfc9">Precio</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div style="display:flex;justify-content:flex-end;margin-top:16px">
              <div style="text-align:right">
                <p style="font-size:18px;font-weight:700;margin:0">Total: ${total.toFixed(2)} €</p>
                <p style="font-size:13px;color:#8a8680;margin:4px 0 0">Envío gratuito</p>
              </div>
            </div>
          </div>
          <div style="background:#f5f2ee;padding:16px 32px;font-size:12px;color:#8a8680;border-top:1px solid #d4cfc9">
            <p style="margin:0">© ${new Date().getFullYear()} Artesana · Sevilla</p>
          </div>
        </div>
      </body>
      </html>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Confirmación de pedido — Artesana #${orderId.slice(-8).toUpperCase()}`,
        html,
      }),
    })

    const data = await resendRes.json()
    if (!resendRes.ok) throw new Error(data.message || 'Error Resend')

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}