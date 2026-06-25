import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, ShoppingBag, Package, Users, Euro, Download } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { sortOrdersByDate, countUniqueCustomers, exportOrdersCsv, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../lib/admin'
import './AdminStats.css'

function StatCard({ label, value, sub, icon: Icon, trend, color = 'var(--accent)' }) {
  return (
    <div className="stat-card" style={{ '--card-color': color }}>
      <div className="stat-card-icon"><Icon size={20}/></div>
      <p className="stat-card-value">{value}</p>
      <p className="stat-card-label">{label}</p>
      {sub && <p className="stat-card-sub">{sub}</p>}
      {trend !== undefined && (
        <div className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
          <span>{Math.abs(trend)}% vs mes anterior</span>
        </div>
      )}
    </div>
  )
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mini-bar-row">
      <span className="mini-bar-label">{label}</span>
      <div className="mini-bar-track">
        <div className="mini-bar-fill" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span className="mini-bar-val">{value}</span>
    </div>
  )
}

export default function AdminStats() {
  const { orders, products } = useStore()
  const { userCan } = useAuth()
  const sortedOrders = useMemo(() => sortOrdersByDate(orders), [orders])

  const stats = useMemo(() => {
    const now   = new Date()
    const month = now.getMonth()
    const year  = now.getFullYear()
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear  = month === 0 ? year - 1 : year

    const thisMonthOrders = sortedOrders.filter(o => {
      const d = new Date(o.createdAt)
      return d.getMonth() === month && d.getFullYear() === year
    })
    const prevMonthOrders = sortedOrders.filter(o => {
      const d = new Date(o.createdAt)
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear
    })

    const revenue     = sortedOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)
    const thisRevenue = thisMonthOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)
    const prevRevenue = prevMonthOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)
    const revTrend    = prevRevenue > 0 ? Math.round(((thisRevenue - prevRevenue) / prevRevenue) * 100) : 0

    const ordersTrend = prevMonthOrders.length > 0
      ? Math.round(((thisMonthOrders.length - prevMonthOrders.length) / prevMonthOrders.length) * 100)
      : 0

    const productSales = {}
    sortedOrders.filter(o => o.status !== 'cancelled').forEach(o => {
      (o.items || []).forEach(i => {
        productSales[i.productId] = (productSales[i.productId] || 0) + i.qty
      })
    })
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
      .filter(x => x.product)

    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - (5 - i), 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      const total = sortedOrders
        .filter(o => {
          const od = new Date(o.createdAt)
          return od.getMonth() === m && od.getFullYear() === y && o.status !== 'cancelled'
        })
        .reduce((s, o) => s + (o.total || 0), 0)
      return {
        label: d.toLocaleDateString('es-ES', { month: 'short' }),
        value: total,
      }
    })

    const statusCount = {}
    sortedOrders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1 })

    return {
      revenue, thisRevenue, revTrend, thisMonthOrders, ordersTrend,
      topProducts, monthlyRevenue, statusCount,
      uniqueCustomers: countUniqueCustomers(sortedOrders),
    }
  }, [sortedOrders, products])

  const maxMonthly = Math.max(...stats.monthlyRevenue.map(m => m.value), 1)
  const maxTopProduct = stats.topProducts[0]?.qty || 1
  const cancelledCount = sortedOrders.filter(o => o.status !== 'cancelled').length

  return (
    <div className="stats-page">
      <div className="page-header stats-page-header">
        <div>
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-sub">Resumen de rendimiento de la tienda</p>
        </div>
        {userCan('estadisticas.export') && sortedOrders.length > 0 && (
          <button className="btn-add" onClick={() => exportOrdersCsv(sortedOrders)}>
            <Download size={16}/> Exportar CSV
          </button>
        )}
      </div>

      <div className="stats-kpi-grid">
        <StatCard label="Ingresos totales"   value={`${stats.revenue.toFixed(0)} €`} icon={Euro} trend={stats.revTrend} color="#c8502a"/>
        <StatCard label="Pedidos este mes"   value={stats.thisMonthOrders.length} icon={ShoppingBag} trend={stats.ordersTrend} color="#2a7a4a"/>
        <StatCard label="Clientes únicos"    value={stats.uniqueCustomers} icon={Users} color="#5a52c8"/>
        <StatCard label="Ticket medio"       value={cancelledCount > 0 ? `${(stats.revenue / cancelledCount).toFixed(0)} €` : '—'} icon={TrendingUp} color="#c87a2a"/>
      </div>

      <div className="stats-cols">
        <div className="stats-panel">
          <h2>Ingresos mensuales (€)</h2>
          <div className="bar-chart">
            {stats.monthlyRevenue.map((m, i) => (
              <div key={i} className="bar-col">
                <span className="bar-val">{m.value > 0 ? m.value.toFixed(0) : ''}</span>
                <div className="bar" style={{ height: `${(m.value / maxMonthly) * 100}%` }}/>
                <span className="bar-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-panel">
          <h2>Estado de pedidos</h2>
          {Object.entries(stats.statusCount).map(([status, count]) => (
            <MiniBar key={status} label={ORDER_STATUS_LABEL[status] || status}
              value={count} max={sortedOrders.length} color={ORDER_STATUS_COLOR[status] || 'var(--muted)'}/>
          ))}
          {Object.keys(stats.statusCount).length === 0 && <p className="stats-empty">Sin pedidos aún</p>}
        </div>
      </div>

      <div className="stats-panel" style={{ marginTop: 24 }}>
        <h2>Productos más vendidos</h2>
        {stats.topProducts.length === 0 && <p className="stats-empty">Sin ventas registradas todavía.</p>}
        {stats.topProducts.map(({ product, qty }) => (
          <div key={product.id} className="top-product-row">
            <img src={product.image} alt={product.name}/>
            <div className="top-product-info">
              <p className="top-product-name">{product.name}</p>
              <div className="top-product-bar">
                <div className="top-product-fill" style={{ width: `${(qty / maxTopProduct) * 100}%` }}/>
              </div>
            </div>
            <span className="top-product-qty">{qty} ud.</span>
          </div>
        ))}
      </div>
    </div>
  )
}
