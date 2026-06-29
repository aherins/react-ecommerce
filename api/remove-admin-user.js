import { adminHeaders, getSupabaseConfig, verifySuperadmin } from './supabaseAdmin.js'

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
    return json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const auth = await verifySuperadmin(token, supabaseUrl, serviceKey)
  if (!auth.ok) return json({ error: auth.error }, auth.status)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo JSON inválido.' }, 400)
  }

  const userId = String(body.userId || '').trim()
  if (!userId) return json({ error: 'Falta userId.' }, 400)

  const headers = adminHeaders(serviceKey)

  const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, { headers })
  if (!userRes.ok) return json({ error: 'Usuario no encontrado.' }, 404)
  const authUser = await userRes.json()

  const roleDelete = await fetch(
    `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}`,
    { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } },
  )
  if (!roleDelete.ok) {
    const err = await roleDelete.text()
    return json({ error: `No se pudo quitar el acceso: ${err}` }, 500)
  }

  await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ account_type: 'staff' }),
  })

  await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      user_metadata: {
        ...(authUser.user_metadata || {}),
        is_staff: true,
      },
    }),
  })

  return json({ ok: true })
}
