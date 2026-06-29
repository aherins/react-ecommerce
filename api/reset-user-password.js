import { adminHeaders, getSupabaseConfig, verifyAdminRole } from './supabaseAdmin.js'
import { generateTemporaryPassword } from './passwordUtils.js'
import { getResendConfig, sendResendEmail } from './resendClient.js'
import { temporaryPasswordHtml } from './emailTemplates.js'

export const config = { runtime: 'edge' }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function fetchAuthUser(supabaseUrl, headers, userId) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, { headers })
  if (!res.ok) return null
  return res.json()
}

export default async function handler(req) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { serviceKey, supabaseUrl } = getSupabaseConfig()
  if (!serviceKey || !supabaseUrl) {
    return json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY o SUPABASE_URL en el servidor.' }, 500)
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const auth = await verifyAdminRole(token, supabaseUrl, serviceKey, ['superadmin', 'admin'])
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
  const user = await fetchAuthUser(supabaseUrl, headers, userId)
  if (!user?.id) return json({ error: 'Usuario no encontrado.' }, 404)

  const rolesRes = await fetch(
    `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}&select=role`,
    { headers },
  )
  const roles = rolesRes.ok ? await rolesRes.json() : []
  const isStaff = Array.isArray(roles) && roles.length > 0
  const tempPassword = generateTemporaryPassword()

  const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        ...(user.user_metadata || {}),
        must_change_password: true,
        password_reset_at: new Date().toISOString(),
      },
    }),
  })
  const updated = await updateRes.json()
  if (!updateRes.ok) {
    return json({ error: updated.msg || updated.message || 'No se pudo resetear la contraseña.' }, 400)
  }

  const email = updated.email || user.email
  const displayName = updated.user_metadata?.full_name || user.user_metadata?.full_name || email?.split('@')[0] || ''
  let emailSent = false
  try {
    const { siteUrl, storeName } = getResendConfig()
    const loginUrl = `${siteUrl}${isStaff ? '/admin' : '/cuenta'}`
    const result = await sendResendEmail({
      to: email,
      subject: `Contraseña temporal — ${storeName}`,
      html: temporaryPasswordHtml({
        name: displayName,
        email,
        password: tempPassword,
        loginUrl,
        storeName,
        accountLabel: isStaff ? 'el panel de administración' : 'tu cuenta de cliente',
      }),
    })
    emailSent = !result.skipped
  } catch (err) {
    console.warn('reset-user-password email:', err.message)
  }

  return json({
    ok: true,
    userId,
    email,
    tempPassword: emailSent ? null : tempPassword,
    emailSent,
    accountType: isStaff ? 'staff' : 'customer',
  })
}
