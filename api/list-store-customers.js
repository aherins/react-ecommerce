import { adminHeaders, getSupabaseConfig, verifyAdminRole } from './supabaseAdmin.js'

export const config = { runtime: 'edge' }

const CRM_ROLES = ['superadmin', 'admin', 'editor', 'viewer']

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function hasStoreActivity({ orderCount, eventCount, wishlistCount, lastSeenAt }) {
  return orderCount > 0 || eventCount > 0 || wishlistCount > 0 || Boolean(lastSeenAt)
}

function shouldIncludeInCrm({ isActiveTeam, isFormerTeam, orderCount, eventCount, wishlistCount, lastSeenAt }) {
  const isTeamRelated = isActiveTeam || isFormerTeam
  if (isTeamRelated && !hasStoreActivity({ orderCount, eventCount, wishlistCount, lastSeenAt })) {
    return false
  }
  return true
}

export default async function handler(req) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const { serviceKey, supabaseUrl } = getSupabaseConfig()
  if (!serviceKey || !supabaseUrl) {
    return json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const auth = await verifyAdminRole(token, supabaseUrl, serviceKey, CRM_ROLES)
  if (!auth.ok) return json({ error: auth.error }, auth.status)

  const url = new URL(req.url)
  const search = (url.searchParams.get('q') || '').trim().toLowerCase()
  const segment = url.searchParams.get('segment') || 'all'

  const headers = adminHeaders(serviceKey)

  const [authRes, staffRes, profilesRes, ordersRes, eventsRes, wishlistRes] = await Promise.all([
    fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/user_roles?select=user_id,role`, { headers: { ...headers, Accept: 'application/json' } }),
    fetch(`${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,registered_at,last_seen_at,account_type`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
    fetch(`${supabaseUrl}/rest/v1/orders?select=user_id,email,total,created_at`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
    fetch(`${supabaseUrl}/rest/v1/customer_events?select=user_id`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
    fetch(`${supabaseUrl}/rest/v1/wishlist_items?select=user_id`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
  ])

  if (!authRes.ok) return json({ error: 'No se pudieron leer los usuarios.' }, 500)

  const authPayload = await authRes.json()
  const authUsers = authPayload.users || []
  const staffRows = staffRes.ok ? await staffRes.json() : []
  const staffById = Object.fromEntries(staffRows.map(r => [r.user_id, r.role]))
  const profiles = profilesRes.ok ? await profilesRes.json() : []
  const orders = ordersRes.ok ? await ordersRes.json() : []
  const events = eventsRes.ok ? await eventsRes.json() : []
  const wishlist = wishlistRes.ok ? await wishlistRes.json() : []

  const profileById = Object.fromEntries(profiles.map(p => [p.id, p]))

  const eventCountByUser = {}
  for (const e of events) {
    if (!e.user_id) continue
    eventCountByUser[e.user_id] = (eventCountByUser[e.user_id] || 0) + 1
  }

  const wishlistCountByUser = {}
  for (const w of wishlist) {
    if (!w.user_id) continue
    wishlistCountByUser[w.user_id] = (wishlistCountByUser[w.user_id] || 0) + 1
  }

  const orderStats = {}
  for (const o of orders) {
    const keys = []
    if (o.user_id) keys.push(o.user_id)
    if (o.email) keys.push(`email:${o.email.toLowerCase()}`)
    for (const key of keys) {
      if (!orderStats[key]) orderStats[key] = { count: 0, total: 0, lastOrderAt: null }
      orderStats[key].count += 1
      orderStats[key].total += Number(o.total) || 0
      if (!orderStats[key].lastOrderAt || o.created_at > orderStats[key].lastOrderAt) {
        orderStats[key].lastOrderAt = o.created_at
      }
    }
  }

  let customers = authUsers
    .map(u => {
      const profile = profileById[u.id]
      const isActiveTeam = Boolean(staffById[u.id])
      const isFormerTeam = !isActiveTeam && (
        Boolean(u.user_metadata?.is_staff) || profile?.account_type === 'staff'
      )
      const byId = orderStats[u.id] || { count: 0, total: 0, lastOrderAt: null }
      const byEmail = orderStats[`email:${(u.email || '').toLowerCase()}`] || { count: 0, total: 0, lastOrderAt: null }
      const orderCount = Math.max(byId.count, byEmail.count)
      const spent = Math.max(byId.total, byEmail.total)
      const lastOrderAt = [byId.lastOrderAt, byEmail.lastOrderAt].filter(Boolean).sort().pop() || null
      const eventCount = eventCountByUser[u.id] || 0
      const wishlistCount = wishlistCountByUser[u.id] || 0
      const lastSeenAt = profile?.last_seen_at || null

      return {
        id: u.id,
        email: profile?.email || u.email,
        name: profile?.full_name || u.user_metadata?.full_name || '',
        registered_at: profile?.registered_at || u.created_at,
        last_seen_at: lastSeenAt,
        order_count: orderCount,
        total_spent: spent,
        last_order_at: lastOrderAt,
        is_active_team: isActiveTeam,
        is_former_team: isFormerTeam,
        team_role: isActiveTeam ? staffById[u.id] : null,
        _include: shouldIncludeInCrm({
          isActiveTeam,
          isFormerTeam,
          orderCount,
          eventCount,
          wishlistCount,
          lastSeenAt,
        }),
      }
    })
    .filter(c => c._include)
    .map(({ _include, ...c }) => c)

  if (segment === 'store') {
    customers = customers.filter(c => !c.is_active_team && !c.is_former_team)
  } else if (segment === 'team') {
    customers = customers.filter(c => c.is_active_team || c.is_former_team)
  }

  if (search) {
    customers = customers.filter(c =>
      c.email?.toLowerCase().includes(search) ||
      c.name?.toLowerCase().includes(search)
    )
  }

  customers.sort((a, b) => new Date(b.registered_at) - new Date(a.registered_at))

  return json({ customers })
}
