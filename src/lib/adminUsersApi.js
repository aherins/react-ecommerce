export async function createAdminUser({ email, password, role, name, accessToken }) {
  const res = await fetch('/api/invite-admin-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, password, role, name }),
  })

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    throw new Error(data.error || 'No se pudo crear el usuario.')
  }

  return data
}
