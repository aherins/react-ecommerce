import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, Store, Menu, X } from 'lucide-react'
import './AdminLayout.css'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/categorias', label: 'Categorías', icon: Tag },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="admin-root">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <span>ARTESANA</span>
          <button className="sidebar-close" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav className="admin-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `admin-navitem ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <n.icon size={18} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-nav-footer">
          <Link to="/" className="admin-navitem">
            <Store size={18} />Ir a la tienda
          </Link>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <button className="topbar-burger" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="topbar-label">Panel de administración</span>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
