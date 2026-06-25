import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Tag, ShoppingBag, TrendingUp, AlertTriangle } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { sortOrdersByDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '../../lib/admin'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { products, orders } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const sortedOrders = useMemo(() => sortOrdersByDate(orders), [orders])

  const now   = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()

  const thisMonthOrders = sortedOrders.filter(o => {
    const d = new Date(o.createdAt)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const monthRevenue = thisMonthOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total || 0), 0)

  const pendingOrders = sortedOrders.filter(
    o => o.status === 'pending' || o.status === 'processing'
  ).length

  const activeProducts = products.filter(p => p.active).length
  const lowStock       = products.filter(p => p.stock <= 3 && p.active)
  const recentOrders   = sortedOrders.slice(0, 5)

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Admin'

  const stats = [
    { label: 'Ingresos este mes',   value: `${monthRevenue.toFixed(0)} €`, icon: TrendingUp,  to: '/admin/estadisticas', color: '#c8502a' },
    { label: 'Pedidos pendientes',  value: pendingOrders,                  icon: ShoppingBag, to: '/admin/pedidos',      color: '#f59e0b' },
    { label: 'Pedidos este mes',    value: thisMonthOrders.length,         icon: Package,     to: '/admin/pedidos',      color: '#5a52c8' },
    { label: 'Productos activos',   value: activeProducts,                 icon: Tag,         to: '/admin/productos',    color: '#2a7a4a' },
  ]

  const contextMsg = pendingOrders > 0
    ? `Tienes ${pendingOrders} pedido${pendingOrders === 1 ? '' : 's'} pendiente${pendingOrders === 1 ? '' : 's'} de gestionar.`
    : lowStock.length > 0
      ? `${lowStock.length} producto${lowStock.length === 1 ? '' : 's'} con stock bajo.`
      : 'Todo al día por ahora.'

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Hola, {name}</h1>
        <p className="page-sub">{contextMsg}</p>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-icon"><s.icon size={22}/></div>
            <div><p className="stat-value">{s.value}</p><p className="stat-label">{s.label}</p></div>
          </Link>
        ))}
      </div>

      <div className="dashboard-cols">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Pedidos recientes</h2>
            <Link to="/admin/pedidos" className="panel-link">Ver todos →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="panel-empty-state">
              <p>Sin pedidos todavía.</p>
              <Link to="/" className="panel-cta">Ir a la tienda</Link>
            </div>
          ) : recentOrders.map(o => (
            <button
              key={o.id}
              type="button"
              className="recent-order-row"
              onClick={() => navigate('/admin/pedidos', { state: { openOrderId: o.id } })}
            >
              <div>
                <p className="recent-ref">#{o.id.slice(-8).toUpperCase()}</p>
                <p className="recent-date">{new Date(o.createdAt).toLocaleDateString('es-ES')}</p>
              </div>
              <span className="recent-amount">{o.total?.toFixed(2)} €</span>
              <span
                className="recent-status-pill"
                style={{ background: `${ORDER_STATUS_COLOR[o.status]}22`, color: ORDER_STATUS_COLOR[o.status] }}
              >
                {ORDER_STATUS_LABEL[o.status] || o.status}
              </span>
            </button>
          ))}
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2><AlertTriangle size={16} color="#f59e0b"/> Stock bajo</h2>
            <Link to="/admin/productos" className="panel-link">Gestionar →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="panel-empty">Todo el stock está bien.</p>
          ) : lowStock.map(p => (
            <div key={p.id} className="alert-row">
              <img src={p.image} alt={p.name} className="alert-img"/>
              <span className="alert-name">{p.name}</span>
              <span className={`alert-stock ${p.stock === 0 ? 'zero' : ''}`}>{p.stock} ud.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
