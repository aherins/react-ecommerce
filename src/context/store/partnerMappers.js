export function supplierToDb(s) {
  return {
    id:            s.id,
    name:          s.name,
    contact_name:  s.contactName || null,
    email:         s.email || null,
    phone:         s.phone || null,
    website:       s.website || null,
    address:       s.address || null,
    notes:         s.notes || null,
    active:        s.active !== false,
    created_at:    s.createdAt || new Date().toISOString(),
  }
}

export function supplierFromDb(r) {
  return {
    id:          r.id,
    name:        r.name,
    contactName: r.contact_name || '',
    email:       r.email || '',
    phone:       r.phone || '',
    website:     r.website || '',
    address:     r.address || '',
    notes:       r.notes || '',
    active:      r.active !== false,
    createdAt:   r.created_at,
  }
}

export function shippingCarrierToDb(c) {
  return {
    id:                    c.id,
    name:                  c.name,
    code:                  c.code || null,
    tracking_url_template: c.trackingUrlTemplate || null,
    phone:                 c.phone || null,
    website:               c.website || null,
    notes:                 c.notes || null,
    active:                c.active !== false,
    created_at:            c.createdAt || new Date().toISOString(),
  }
}

export function shippingCarrierFromDb(r) {
  return {
    id:                  r.id,
    name:                r.name,
    code:                r.code || '',
    trackingUrlTemplate: r.tracking_url_template || '',
    phone:               r.phone || '',
    website:             r.website || '',
    notes:               r.notes || '',
    active:              r.active !== false,
    createdAt:           r.created_at,
  }
}
