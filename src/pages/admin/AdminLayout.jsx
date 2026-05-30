import React, { useState } from 'react'
import { Outlet, NavLink, Link, Navigate } from 'react-router-dom' // Añadido Navigate
import { LayoutDashboard, Package, Tag, Store, Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Login from './Login'
import './AdminLayout.css'

const NAV = [
  { to: '/admin',             label: 'Dashboard',  icon: LayoutDashboard, end: true },
  { to: '/admin/productos',   label: 'Productos',  icon: Package },
  { to: '/admin/categorias',  label: 'Categorías', icon: Tag },
]

// Componente UserChip con protección ante nulos
function UserChip({ user }) {
  if (!user) return null; // Seguridad extra

  const avatar = user?.user_metadata?.avatar_url
  const name   = user?.user_metadata?.full_name || user?.email || 'Usuario'
  
  return (
    <div className="admin-user">
      {avatar
        ? <img src={avatar} alt={name} className="admin-avatar" referrerPolicy="no-referrer" />
        : <div className="admin-avatar-fallback"><User size={14} /></div>
      }
      <span title={name}>{name}</span>
    </div>
  )
}

export default function AdminLayout() {
  // Extraemos isAdmin y provider por si los necesitas después
  const { user, loading, signOut, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)

  // 1. Mientras carga, mostrar spinner
  if (loading) {
    return (
      <div className="admin-loading">
        <span className="spinner dark" />
        <p>Verificando credenciales...</p>
      </div>
    )
  }

  // 2. Si no hay usuario después de cargar, mostrar Login
  // Nota: Si usas rutas protegidas por redirección, aquí podrías usar <Navigate to="/login" />
  if (!user) {
    return <Login />
  }

  return (
    <div className="admin-root">
      {/* Overlay para cerrar el menú en móvil al hacer click fuera */}
      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}

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
          <UserChip user={user} />
          
          <button 
            className="admin-navitem signout" 
            onClick={async () => {
              await signOut();
              setOpen(false);
            }}
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>

          <Link to="/" className="admin-navitem">
            <Store size={18} />
            <span>Ver tienda</span>
          </Link>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <button className="topbar-burger" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="topbar-label">Panel de administración</span>
        </header>

        <main className="admin-content">
          {/* Aquí se renderizan AdminDashboard, AdminProducts, etc. */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}