import { getResendConfig, sendResendEmail } from './resendClient.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const { contactTo } = getResendConfig()

  try {
    const { name, email, subject, message } = await req.json()
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'Completa todos los campos.' }), { status: 400 })
    }

    const result = await sendResendEmail({
      to: contactTo,
      replyTo: email,
      subject: `[Contacto] ${subject || 'Consulta'} — ${name}`,
      html: `<p><strong>${name}</strong> (${email})</p><p>${message.replace(/\n/g, '<br>')}</p>`,
    })

    if (result.skipped) {
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
