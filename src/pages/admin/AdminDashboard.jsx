import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Tag, ShoppingBag, TrendingUp, Heart, Users, Truck, BarChart2 } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { products, categories, orders, wishlist } = useStore()
  const activeProducts = products.filter(p => p.active).length
  const pendingOrders  = orders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const totalRevenue   = orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+(o.total||0),0)
  const lowStock       = products.filter(p => p.stock <= 3 && p.active)

  const stats = [
    { label: 'Ingresos totales',    value: `${totalRevenue.toFixed(0)} €`, icon: TrendingUp,  to: '/admin/estadisticas', color: '#c8502a' },
    { label: 'Pedidos pendientes',  value: pendingOrders,                   icon: ShoppingBag, to: '/admin/pedidos',      color: '#f59e0b' },
    { label: 'Pedidos totales',     value: orders.length,                   icon: Package,     to: '/admin/pedidos',      color: '#5a52c8' },
    { label: 'Productos activos',   value: activeProducts,                  icon: Tag,         to: '/admin/productos',    color: '#2a7a4a' },
  ]

  const STATUS_LABEL = { pending:'Pendiente', processing:'Preparación', shipped:'Enviado', delivered:'Entregado', cancelled:'Cancelado' }
  const STATUS_COLOR = { pending:'#f59e0b', processing:'#3b82f6', shipped:'#06b6d4', delivered:'#22c55e', cancelled:'#ef4444' }

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Bienvenido al panel de administración</p>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <Link key={s.label} to={s.to} className="stat-card" style={{'--stat-color':s.color}}>
            <div className="stat-icon"><s.icon size={22}/></div>
            <div><p className="stat-value">{s.value}</p><p className="stat-label">{s.label}</p></div>
          </Link>
        ))}
      </div>

      <div className="dashboard-cols">
        {/* Recent orders */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Pedidos recientes</h2>
            <Link to="/admin/pedidos" className="panel-link">Ver todos →</Link>
          </div>
          {recentOrders.length === 0
            ? <p className="panel-empty">Sin pedidos todavía.</p>
            : recentOrders.map(o => (
              <div key={o.id} className="recent-order-row">
                <div>
                  <p className="recent-ref">#{o.id.slice(-8).toUpperCase()}</p>
                  <p className="recent-date">{new Date(o.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
                <span className="recent-amount">{o.total?.toFixed(2)} €</span>
                <span className="status-dot" style={{background: STATUS_COLOR[o.status]}} title={STATUS_LABEL[o.status]}/>
              </div>
            ))
          }
        </div>

        {/* Low stock */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>⚠ Stock bajo</h2>
            <Link to="/admin/productos" className="panel-link">Gestionar →</Link>
          </div>
          {lowStock.length === 0
            ? <p className="panel-empty">Todo el stock está bien.</p>
            : lowStock.map(p => (
              <div key={p.id} className="alert-row">
                <img src={p.image} alt={p.name} className="alert-img"/>
                <span className="alert-name">{p.name}</span>
                <span className={`alert-stock ${p.stock===0?'zero':''}`}>{p.stock} ud.</span>
              </div>
            ))
          }
        </div>
      </div>

      <div className="quick-links">
        <h2 className="section-title">Accesos rápidos</h2>
        <div className="quick-grid">
          {[
            { to:'/admin/pedidos',      icon:ShoppingBag, label:'Gestionar pedidos'   },
            { to:'/admin/productos',    icon:Package,     label:'Gestionar productos'  },
            { to:'/admin/estadisticas', icon:BarChart2,   label:'Ver estadísticas'     },
            { to:'/admin/envios',       icon:Truck,       label:'Gestionar envíos'     },
          ].map(q => (
            <Link key={q.to} to={q.to} className="quick-card">
              <q.icon size={22}/><span>{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
