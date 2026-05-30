import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Store, 
  Menu, 
  X, 
  LogOut, 
  User 
} from 'lucide-react'

import { useAuth } from '../../context/AuthContext'
import { hasSupabase } from '../../lib/supabase'
import './AdminLayout.css'

const NAV = [
  { to: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/productos',  label: 'Productos',  icon: Package },
  { to: '/admin/categorias', label: 'Categorías', icon: Tag },
  { to: '/admin/pedidos',    label: 'Pedidos',    icon: Package },
]

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  // Pantalla de carga mientras verifica la sesión
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner dark" />
        <p>Verificando credenciales...</p>
      </div>
    )
  }

  return (
    <div className="admin-root">
      {/* Sidebar - Menú Lateral */}
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <span>ARTESANA</span>
          <button className="sidebar-close" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to} 
              to={n.to} 
              end={n.end}
              className={({ isActive }) => `admin-navitem ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-nav-footer">
          <div className="admin-user">
            <User size={14} />
            <span>{user?.email}</span>
          </div>
          
          <button className="admin-navitem signout" onClick={signOut}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
          
          <Link to="/" className="admin-navitem">
            <Store size={18} />
            <span>Ver tienda</span>
          </Link>
        </div>
      </aside>

      {/* Cuerpo Principal */}
      <div className="admin-body">
        <header className="admin-topbar">
          <button className="topbar-burger" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="topbar-label">Panel de administración</span>
          {!hasSupabase && <span className="topbar-mode">modo demo</span>}
        </header>

        <main className="admin-content">
          {/* Aquí se renderizarán las sub-páginas (Dashboard, Productos, etc.) */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}