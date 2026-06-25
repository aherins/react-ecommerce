export function loadLocal(key) {
  try {
    const v = localStorage.getItem(key)
    if (!v || v === 'null' || v === 'undefined') return []
    const parsed = JSON.parse(v)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
