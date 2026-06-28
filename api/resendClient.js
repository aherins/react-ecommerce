export function getResendConfig() {
  const vercelUrl = process.env.VERCEL_URL
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    contactTo: process.env.CONTACT_TO || process.env.RESEND_FROM || 'onboarding@resend.dev',
    siteUrl: process.env.SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5173'),
    storeName: process.env.STORE_NAME || 'Artesana',
  }
}

export async function sendResendEmail({ to, subject, html, replyTo, from }) {
  const { apiKey, from: defaultFrom } = getResendConfig()
  if (!apiKey) {
    return { ok: true, skipped: true }
  }

  const recipients = Array.isArray(to) ? to : [to]
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: from || defaultFrom,
      to: recipients,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Error al enviar el email')
  return { ok: true, id: data.id }
}
