import { adminHeaders, getSupabaseConfig, verifyAdminRole } from './supabaseAdmin.js'

export const config = { runtime: 'edge' }

const NOTE_ROLES = ['superadmin', 'admin', 'editor']

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
    return json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const auth = await verifyAdminRole(token, supabaseUrl, serviceKey, NOTE_ROLES)
  if (!auth.ok) return json({ error: auth.error }, auth.status)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo JSON inválido.' }, 400)
  }

  const userId = String(body.user_id || '')
  const noteBody = String(body.body || '').trim()
  if (!userId) return json({ error: 'Falta id de cliente.' }, 400)
  if (!noteBody) return json({ error: 'Escribe una nota.' }, 400)

  const headers = adminHeaders(serviceKey)
  const res = await fetch(`${supabaseUrl}/rest/v1/customer_notes`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: userId,
      author_id: auth.me.id,
      body: noteBody,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return json({ error: `No se pudo guardar la nota: ${err}` }, 500)
  }

  const [note] = await res.json()
  return json({
    note: {
      ...note,
      author_name: auth.me.user_metadata?.full_name || auth.me.email,
    },
  })
}
