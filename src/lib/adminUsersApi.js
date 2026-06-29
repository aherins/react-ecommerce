async function parseJson(res) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export async function fetchAdminUsers(accessToken) {
  const res = await fetch('/api/list-admin-users', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios.')
  return data.users || []
}

export async function createAdminUser({ email, password, role, name, accessToken }) {
  const res = await fetch('/api/invite-admin-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, password, role, name }),
  })

  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'No se pudo crear el usuario.')
  return data
}

export async function resetAdminUserPassword({ userId, accessToken }) {
  const res = await fetch('/api/reset-user-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'No se pudo resetear la contraseña.')
  return data
}
