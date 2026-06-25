import { adminHeaders, getSupabaseConfig, verifyAdminRole } from './supabaseAdmin.js'

export const config = { runtime: 'edge' }

const CRM_ROLES = ['superadmin', 'admin', 'editor', 'viewer']

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
    return json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const auth = await verifyAdminRole(token, supabaseUrl, serviceKey, CRM_ROLES)
  if (!auth.ok) return json({ error: auth.error }, auth.status)

  const userId = new URL(req.url).searchParams.get('id')
  if (!userId) return json({ error: 'Falta id de cliente.' }, 400)

  const headers = adminHeaders(serviceKey)

  const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, { headers })
  if (!userRes.ok) return json({ error: 'Cliente no encontrado.' }, 404)
  const authUser = await userRes.json()

  const staffRes = await fetch(
    `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&select=role`,
    { headers: { ...headers, Accept: 'application/json' } },
  )
  const staffRows = staffRes.ok ? await staffRes.json() : []
  if (Array.isArray(staffRows) && staffRows.length > 0) {
    return json({ error: 'Este usuario es del equipo, no un cliente.' }, 400)
  }

  const emailEnc = encodeURIComponent(authUser.email || '')
  const [profileRes, eventsRes, wishlistRes, notesRes, ordersRes, productsRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: { ...headers, Accept: 'application/vnd.pgrst.object+json' },
    }),
    fetch(`${supabaseUrl}/rest/v1/customer_events?user_id=eq.${userId}&select=*&order=created_at.desc&limit=40`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
    fetch(`${supabaseUrl}/rest/v1/wishlist_items?user_id=eq.${userId}&select=product_id,added_at&order=added_at.desc`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
    fetch(`${supabaseUrl}/rest/v1/customer_notes?user_id=eq.${userId}&select=id,body,created_at,author_id&order=created_at.desc`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
    fetch(
      `${supabaseUrl}/rest/v1/orders?or=(user_id.eq.${userId},email.eq.${emailEnc})&select=*&order=created_at.desc`,
      { headers: { ...headers, Accept: 'application/json' } },
    ),
    fetch(`${supabaseUrl}/rest/v1/products?select=id,name,price,image`, {
      headers: { ...headers, Accept: 'application/json' },
    }),
  ])

  const profile = profileRes.ok ? await profileRes.json() : null
  const events = eventsRes.ok ? await eventsRes.json() : []
  const wishlist = wishlistRes.ok ? await wishlistRes.json() : []
  const notes = notesRes.ok ? await notesRes.json() : []
  const orders = ordersRes.ok ? await ordersRes.json() : []
  const products = productsRes.ok ? await productsRes.json() : []
  const productById = Object.fromEntries(products.map(p => [p.id, p]))

  const authorIds = [...new Set(notes.map(n => n.author_id).filter(Boolean))]
  const authors = {}
  await Promise.all(authorIds.map(async (aid) => {
    const r = await fetch(`${supabaseUrl}/auth/v1/admin/users/${aid}`, { headers })
    if (r.ok) {
      const u = await r.json()
      authors[aid] = u.user_metadata?.full_name || u.email
    }
  }))

  return json({
    customer: {
      id: authUser.id,
      email: profile?.email || authUser.email,
      name: profile?.full_name || authUser.user_metadata?.full_name || '',
      registered_at: profile?.registered_at || authUser.created_at,
      last_seen_at: profile?.last_seen_at || null,
      avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
    },
    orders,
    events: events.map(e => ({
      ...e,
      product: e.product_id ? productById[e.product_id] || null : null,
    })),
    wishlist: wishlist.map(w => ({
      ...w,
      product: productById[w.product_id] || null,
    })),
    notes: notes.map(n => ({
      ...n,
      author_name: authors[n.author_id] || 'Equipo',
    })),
    stats: {
      order_count: orders.length,
      total_spent: orders.reduce((s, o) => s + (Number(o.total) || 0), 0),
      wishlist_count: wishlist.length,
      views_count: events.filter(e => e.event_type === 'product_view').length,
    },
  })
}
