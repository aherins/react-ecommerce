import { ORDER_STATUS_OPTIONS } from './admin'
import { getCategoryLabel } from './categories'

export const STATS_PERIODS = [
  { key: '30d', label: '30 días', days: 30 },
  { key: '90d', label: '3 meses', days: 90 },
  { key: '365d', label: '12 meses', days: 365 },
  { key: 'all', label: 'Todo', days: null },
]

function isValidOrder(o) {
  return o && o.status !== 'cancelled'
}

function inRange(dateStr, from, to) {
  const t = new Date(dateStr).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

export function getPeriodRange(periodKey, now = new Date()) {
  const opt = STATS_PERIODS.find(p => p.key === periodKey) || STATS_PERIODS[0]
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)

  if (!opt.days) {
    return { from: new Date(0), to, prevFrom: null, prevTo: null, label: opt.label }
  }

  const from = new Date(now)
  from.setDate(from.getDate() - opt.days + 1)
  from.setHours(0, 0, 0, 0)

  const span = to.getTime() - from.getTime()
  const prevTo = new Date(from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - span)

  return { from, to, prevFrom, prevTo, label: opt.label, days: opt.days }
}

export function filterOrdersInRange(orders, from, to) {
  return (orders || []).filter(o => o.createdAt && inRange(o.createdAt, from, to))
}

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function sumRevenue(orders) {
  return orders.filter(isValidOrder).reduce((s, o) => s + (o.total || 0), 0)
}

function uniqueCustomers(orders) {
  const keys = new Set()
  for (const o of orders || []) {
    if (o.userId) keys.add(`u:${o.userId}`)
    else if (o.email) keys.add(`e:${o.email.toLowerCase()}`)
  }
  return keys.size
}

function monthlyBuckets(orders, months = 6, now = new Date()) {
  const buckets = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth()
    const y = d.getFullYear()
    const monthOrders = orders.filter(o => {
      const od = new Date(o.createdAt)
      return od.getMonth() === m && od.getFullYear() === y
    })
    const valid = monthOrders.filter(isValidOrder)
    buckets.push({
      label: d.toLocaleDateString('es-ES', { month: 'short', year: i === 0 || d.getMonth() === 0 ? '2-digit' : undefined }),
      shortLabel: d.toLocaleDateString('es-ES', { month: 'short' }),
      revenue: valid.reduce((s, o) => s + (o.total || 0), 0),
      orders: monthOrders.length,
      cancelled: monthOrders.filter(o => o.status === 'cancelled').length,
    })
  }
  return buckets
}

export function computeStoreStats(orders, products, categories, periodKey = '30d') {
  const all = [...(orders || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const range = getPeriodRange(periodKey)
  const periodOrders = filterOrdersInRange(all, range.from, range.to)
  const prevOrders = range.prevFrom
    ? filterOrdersInRange(all, range.prevFrom, range.prevTo)
    : []

  const validPeriod = periodOrders.filter(isValidOrder)
  const validPrev = prevOrders.filter(isValidOrder)

  const revenue = sumRevenue(periodOrders)
  const prevRevenue = sumRevenue(prevOrders)
  const orderCount = periodOrders.length
  const prevOrderCount = prevOrders.length
  const avgTicket = validPeriod.length ? revenue / validPeriod.length : 0
  const cancelRate = orderCount
    ? Math.round((periodOrders.filter(o => o.status === 'cancelled').length / orderCount) * 100)
    : 0

  const productSales = {}
  const productRevenue = {}
  validPeriod.forEach(o => {
    (o.items || []).forEach(i => {
      productSales[i.productId] = (productSales[i.productId] || 0) + i.qty
      productRevenue[i.productId] = (productRevenue[i.productId] || 0) + (i.price || 0) * i.qty
    })
  })

  const topByUnits = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qty]) => ({
      product: products.find(p => p.id === id),
      qty,
      revenue: productRevenue[id] || 0,
    }))
    .filter(x => x.product)

  const categorySales = {}
  validPeriod.forEach(o => {
    (o.items || []).forEach(i => {
      const p = products.find(pr => pr.id === i.productId)
      if (!p?.categoryId) return
      categorySales[p.categoryId] = (categorySales[p.categoryId] || 0) + i.qty
    })
  })

  const topCategories = Object.entries(categorySales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qty]) => ({
      category: categories.find(c => c.id === id),
      categoryLabel: getCategoryLabel(categories, id),
      qty,
    }))
    .filter(x => x.category)

  const customerSpend = {}
  validPeriod.forEach(o => {
    const key = o.userId || o.email?.toLowerCase()
    if (!key) return
    customerSpend[key] = (customerSpend[key] || 0) + (o.total || 0)
  })

  const topCustomers = Object.entries(customerSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, spent]) => {
      const sample = validPeriod.find(o => (o.userId || o.email?.toLowerCase()) === key)
      return { email: sample?.email || '—', spent, orders: validPeriod.filter(o => (o.userId || o.email?.toLowerCase()) === key).length }
    })

  const statusCount = {}
  ORDER_STATUS_OPTIONS.forEach(s => { statusCount[s] = 0 })
  periodOrders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1 })

  const simulated = validPeriod.filter(o => o.simulated).length
  const realPayments = validPeriod.length - simulated

  const lowStock = (products || []).filter(p => p.active && p.stock <= 3)

  const monthCount = periodKey === '30d' ? 3 : periodKey === '90d' ? 4 : 6

  return {
    range,
    revenue,
    revenueTrend: pctChange(revenue, prevRevenue),
    orderCount,
    validOrderCount: validPeriod.length,
    ordersTrend: pctChange(orderCount, prevOrderCount),
    avgTicket,
    cancelRate,
    uniqueCustomers: uniqueCustomers(periodOrders),
    topByUnits,
    topCategories,
    topCustomers,
    statusCount,
    monthly: monthlyBuckets(all.filter(o => {
      const d = new Date(o.createdAt)
      const cutoff = new Date()
      cutoff.setMonth(cutoff.getMonth() - monthCount + 1)
      cutoff.setDate(1)
      return d >= cutoff
    }), monthCount),
    simulated,
    realPayments,
    lowStock,
    totalOrdersAll: all.length,
    hasComparison: Boolean(range.prevFrom),
  }
}
