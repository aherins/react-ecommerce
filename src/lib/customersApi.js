async function parseJson(res) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

export async function fetchStoreCustomers(accessToken, q = '') {
  const url = q ? `/api/list-store-customers?q=${encodeURIComponent(q)}` : '/api/list-store-customers'
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los clientes.')
  return data.customers || []
}

export async function fetchStoreCustomerDetail(accessToken, id) {
  const res = await fetch(`/api/store-customer-detail?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'No se pudo cargar el cliente.')
  return data
}

export async function addCustomerNote(accessToken, userId, body) {
  const res = await fetch('/api/store-customer-note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ user_id: userId, body }),
  })
  const data = await parseJson(res)
  if (!res.ok) throw new Error(data.error || 'No se pudo guardar la nota.')
  return data.note
}

export async function resetCustomerPassword(accessToken, userId) {
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
