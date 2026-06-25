export function orderToDb(o) {
  return {
    id:               o.id,
    payment_id:       o.paymentId || o.id,
    user_id:          o.userId || null,
    created_at:       o.createdAt || new Date().toISOString(),
    status:           o.status || 'pending',
    total:            o.total,
    subtotal:         o.subtotal ?? o.total,
    discount:         o.discount || 0,
    coupon_code:      o.couponCode || null,
    items:            o.items || [],
    email:            o.email || null,
    tracking_number:  o.trackingNumber || null,
    simulated:        o.simulated || false,
  }
}

export function orderFromDb(r) {
  return {
    id:             r.id,
    paymentId:      r.payment_id,
    userId:         r.user_id || null,
    createdAt:      r.created_at,
    status:         r.status,
    total:          Number(r.total),
    subtotal:       Number(r.subtotal ?? r.total),
    discount:       Number(r.discount || 0),
    couponCode:     r.coupon_code,
    items:          r.items || [],
    email:          r.email,
    trackingNumber: r.tracking_number,
    simulated:      r.simulated,
  }
}
