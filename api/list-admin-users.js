import { adminHeaders, getSupabaseConfig, verifySuperadmin } from './supabaseAdmin.js'

export const config = { runtime: 'edge' }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const { serviceKey, supabaseUrl } = getSupabaseConfig()
  if (!serviceKey || !supabaseUrl) {
    return json({
      error: 'Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_URL en el servidor.',
    }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const auth = await verifySuperadmin(token, supabaseUrl, serviceKey)
  if (!auth.ok) return json({ error: auth.error }, auth.status)

  const headers = adminHeaders(serviceKey)

  const rolesRes = await fetch(
    `${supabaseUrl}/rest/v1/user_roles?select=user_id,role,created_at&order=created_at.desc`,
    { headers: { ...headers, Accept: 'application/json' } },
  )
  if (!rolesRes.ok) {
    const err = await rolesRes.text()
    return json({ error: `No se pudieron leer los roles: ${err}` }, 500)
  }
  const roles = await rolesRes.json()
  if (!roles.length) return json({ users: [] })

  const ids = roles.map(r => `"${r.user_id}"`).join(',')
  const [profilesRes, authRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/profiles?id=in.(${ids})&select=id,email,full_name`,
      { headers: { ...headers, Accept: 'application/json' } },
    ),
    fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, { headers }),
  ])

  const profiles = profilesRes.ok ? await profilesRes.json() : []
  const authPayload = authRes.ok ? await authRes.json() : { users: [] }
  const authUsers = authPayload.users || []

  const profileById = Object.fromEntries(profiles.map(p => [p.id, p]))
  const authById = Object.fromEntries(authUsers.map(u => [u.id, u]))

  const users = roles.map(r => {
    const profile = profileById[r.user_id]
    const authUser = authById[r.user_id]
    return {
      id: r.user_id,
      role: r.role,
      email: profile?.email || authUser?.email || '—',
      name: profile?.full_name || authUser?.user_metadata?.full_name || '',
      created_at: r.created_at,
    }
  })

  return json({ users })
}
