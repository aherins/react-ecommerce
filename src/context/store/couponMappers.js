export function couponToDb(c) {
  return {
    id:             c.id,
    code:           c.code,
    description:    c.description   || null,
    scope:          c.scope,
    specific_email: c.specificEmail || null,
    discount_type:  c.discountType,
    discount_value: c.discountValue,
    min_amount:     c.minAmount     || 0,
    min_items:      c.minItems      || 0,
    max_uses:       c.maxUses       ?? null,
    used_count:     c.usedCount     || 0,
    active:         c.active,
    expires_at:     c.expiresAt     || null,
    created_at:     c.createdAt     || new Date().toISOString(),
  }
}

export function couponFromDb(r) {
  return {
    id:            r.id,
    code:          r.code,
    description:   r.description    || '',
    scope:         r.scope,
    specificEmail: r.specific_email || null,
    discountType:  r.discount_type,
    discountValue: r.discount_value,
    minAmount:     r.min_amount     || 0,
    minItems:      r.min_items      || 0,
    maxUses:       r.max_uses       ?? null,
    usedCount:     r.used_count     || 0,
    usedBy:        [],
    active:        r.active,
    expiresAt:     r.expires_at     || null,
    createdAt:     r.created_at,
  }
}
