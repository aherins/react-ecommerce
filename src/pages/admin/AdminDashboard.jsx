import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Tag, ShoppingBag, TrendingUp } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const { products, categories, cart } = useStore()
  const activeProducts = products.filter(p => p.active).length
  const lowStock = products.filter(p => p.stock <= 3 && p.active)

  const stats = [
    { label: 'Productos activos', value: activeProducts, icon: Package, to: '/admin/productos', color: '#c8502a' },
    { label: 'Categorías', value: categories.length, icon: Tag, to: '/admin/categorias', color: '#2a7a4a' },
    { label: 'Items en carrito', value: cart.reduce((s,i) => s+i.qty,0), icon: ShoppingBag, color: '#5a52c8' },
    { label: 'Valor inventario', value: products.reduce((s,p) => s + p.price*p.stock, 0).toFixed(0) + ' €', icon: TrendingUp, color: '#c87a2a' },
  ]

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Resumen general de la tienda</p>
      </div>

      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ '--stat-color': s.color }}>
            <div className="stat-icon"><s.icon size={22} /></div>
            <div>
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="alert-section">
          <h2 className="section-title">⚠ Stock bajo</h2>
          <div className="alert-list">
            {lowStock.map(p => (
              <div key={p.id} className="alert-row">
                <img src={p.image} alt={p.name} className="alert-img" />
                <span className="alert-name">{p.name}</span>
                <span className="alert-stock">{p.stock} ud.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quick-links">
        <h2 className="section-title">Acciones rápidas</h2>
        <div className="quick-grid">
          <Link to="/admin/productos" className="quick-card">
            <Package size={24} />
            <span>Gestionar productos</span>
          </Link>
          <Link to="/admin/categorias" className="quick-card">
            <Tag size={24} />
            <span>Gestionar categorías</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
