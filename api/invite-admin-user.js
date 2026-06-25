// Crea usuarios del panel admin con service role (nunca expuesta al cliente)

export const config = { runtime: 'edge' }

const VALID_ROLES = ['superadmin', 'admin', 'editor', 'viewer']

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .replace(/\/(rest\/v1\/?|auth\/v1\/?)$/, '')
    .replace(/\/$/, '')

  if (!serviceKey || !supabaseUrl) {
    return json({
      error: 'Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_URL en el servidor (Vercel → Environment Variables).',
    }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Sesión no válida.' }, 401)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo JSON inválido.' }, 400)
  }

  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const role = String(body.role || 'viewer')
  const name = String(body.name || '').trim()

  if (!email) return json({ error: 'Introduce un email.' }, 400)
  if (!VALID_ROLES.includes(role)) return json({ error: 'Rol no válido.' }, 400)
  if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400)

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  // Verificar que quien llama es superadmin
  const meRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  })
  const me = await meRes.json()
  if (!meRes.ok || !me?.id) {
    return json({ error: 'Sesión expirada. Vuelve a iniciar sesión.' }, 401)
  }

  const roleRes = await fetch(
    `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${me.id}&select=role`,
    { headers: { ...headers, Accept: 'application/vnd.pgrst.object+json' } },
  )
  const callerRole = roleRes.ok ? await roleRes.json() : null
  if (callerRole?.role !== 'superadmin') {
    return json({ error: 'Solo un superadmin puede crear usuarios.' }, 403)
  }

  // Crear usuario en Auth (confirmado, sin email de invitación)
  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { full_name: name } : {},
    }),
  })
  const created = await createRes.json()
  if (!createRes.ok) {
    return json({ error: created.msg || created.message || created.error_description || 'No se pudo crear el usuario.' }, 400)
  }

  const userId = created.id
  if (!userId) return json({ error: 'Usuario creado pero sin ID.' }, 500)

  const roleUpsert = await fetch(`${supabaseUrl}/rest/v1/user_roles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, role }),
  })
  if (!roleUpsert.ok) {
    const err = await roleUpsert.text()
    return json({ error: `Usuario creado pero falló asignar rol: ${err}` }, 500)
  }

  await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      id: userId,
      email,
      full_name: name || email.split('@')[0],
    }),
  })

  return json({ ok: true, user_id: userId, email, role })
}
