const MIN_LENGTH = 8

export const PASSWORD_RULES = [
  { id: 'length', test: (p) => p.length >= MIN_LENGTH, label: 'Al menos 8 caracteres' },
  { id: 'lower', test: (p) => /[a-z]/.test(p), label: 'Una minúscula' },
  { id: 'upper', test: (p) => /[A-Z]/.test(p), label: 'Una mayúscula' },
  { id: 'digit', test: (p) => /[0-9]/.test(p), label: 'Un número' },
  { id: 'special', test: (p) => /[^a-zA-Z0-9]/.test(p), label: 'Un carácter especial' },
]

export function getPasswordValidation(password) {
  const checks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    ok: rule.test(password),
  }))
  const valid = checks.every((c) => c.ok)
  const missing = checks.filter((c) => !c.ok).map((c) => c.label)
  const message = valid
    ? ''
    : `La contraseña debe incluir: ${missing.join(', ').toLowerCase()}.`
  return { valid, checks, message }
}

function pickRandom(chars) {
  const bytes = new Uint32Array(1)
  crypto.getRandomValues(bytes)
  return chars[bytes[0] % chars.length]
}

function shuffle(values) {
  const arr = [...values]
  for (let i = arr.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1)
    crypto.getRandomValues(bytes)
    const j = bytes[0] % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateSecurePassword(length = 14) {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const special = '!@#$%&*+-=?'
  const all = lower + upper + digits + special
  const size = Math.max(length, MIN_LENGTH)

  const required = [
    pickRandom(lower),
    pickRandom(upper),
    pickRandom(digits),
    pickRandom(special),
  ]
  const rest = Array.from({ length: size - required.length }, () => pickRandom(all))
  return shuffle([...required, ...rest]).join('')
}
