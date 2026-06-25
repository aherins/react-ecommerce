export function getSupabaseConfig() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
    .replace(/\/(rest\/v1\/?|auth\/v1\/?)$/, '')
    .replace(/\/$/, '')

  return { serviceKey, supabaseUrl }
}

export function adminHeaders(serviceKey) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }
}

export async function verifySuperadmin(token, supabaseUrl, serviceKey) {
  if (!token) return { ok: false, status: 401, error: 'Sesión no válida.' }

  const meRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${token}` },
  })
  const me = await meRes.json()
  if (!meRes.ok || !me?.id) {
    return { ok: false, status: 401, error: 'Sesión expirada. Vuelve a iniciar sesión.' }
  }

  const roleRes = await fetch(
    `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${me.id}&select=role`,
    { headers: { ...adminHeaders(serviceKey), Accept: 'application/vnd.pgrst.object+json' } },
  )
  const callerRole = roleRes.ok ? await roleRes.json() : null
  if (callerRole?.role !== 'superadmin') {
    return { ok: false, status: 403, error: 'Solo un superadmin puede gestionar usuarios.' }
  }

  return { ok: true, me }
}
