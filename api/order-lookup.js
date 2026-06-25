import { adminHeaders, getSupabaseConfig } from './supabaseAdmin.js'

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
    return json({ error: 'Servidor no configurado.' }, 500)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  const orderId = String(body.orderId || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  if (!orderId || !email) return json({ error: 'Introduce referencia y email.' }, 400)

  const headers = adminHeaders(serviceKey)
  const res = await fetch(
    `${supabaseUrl}/rest/v1/orders?email=ilike.${encodeURIComponent(email)}&select=*&order=created_at.desc&limit=20`,
    { headers: { ...headers, Accept: 'application/json' } },
  )

  if (!res.ok) return json({ error: 'Error al buscar el pedido.' }, 500)

  const rows = await res.json()
  const q = orderId.toLowerCase()
  const match = rows.find(o =>
    o.id === orderId ||
    o.id?.toLowerCase().includes(q) ||
    o.id?.slice(-8).toUpperCase() === orderId.toUpperCase()
  )

  if (!match) return json({ error: 'No encontramos un pedido con esos datos.' }, 404)

  return json({ order: match })
}
