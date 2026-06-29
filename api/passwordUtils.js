const MIN_LENGTH = 10

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

export function generateTemporaryPassword(length = 12) {
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
