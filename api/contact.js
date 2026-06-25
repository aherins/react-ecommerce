export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'hola@artesana.es'
  const to = process.env.CONTACT_TO || 'hola@artesana.es'

  try {
    const { name, email, subject, message } = await req.json()
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'Completa todos los campos.' }), { status: 400 })
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Contacto] ${subject || 'Consulta'} — ${name}`,
        html: `<p><strong>${name}</strong> (${email})</p><p>${message.replace(/\n/g, '<br>')}</p>`,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Error al enviar')

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
