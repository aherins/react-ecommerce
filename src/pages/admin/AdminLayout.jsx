import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, Store, Menu, X, LogOut, User, ShoppingBag, BarChart2, Truck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Login from './Login'
import './AdminLayout.css'

const NAV = [
  { to: '/admin',             label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos',     label: 'Pedidos',      icon: ShoppingBag },
  { to: '/admin/productos',   label: 'Productos',    icon: Package },
  { to: '/admin/categorias',  label: 'Categorías',   icon: Tag },
  { to: '/admin/estadisticas',label: 'Estadísticas', icon: BarChart2 },
  { to: '/admin/envios',      label: 'Envíos',       icon: Truck },
]

function UserChip({ user }) {
  const avatar = user?.user_metadata?.avatar_url
  const name   = user?.user_metadata?.full_name || user?.email || ''
  return (
    <div className="admin-user">
      {avatar
        ? <img src={avatar} alt={name} className="admin-avatar" referrerPolicy="no-referrer" />
        : <User size={14} />}
      <span title={name}>{name}</span>
    </div>
  )
}

export default function AdminLayout() {
  const { user, loading, signOut, hasSupabase } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) return <div className="admin-loading"><span className="spinner dark" /></div>
  if (!user)   return <Login />

  return (
    <div className="admin-root">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <span>ARTESANA</span>
          <button className="sidebar-close" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav className="admin-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `admin-navitem ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              <n.icon size={18} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-nav-footer">
          <UserChip user={user} />
          <button className="admin-navitem signout" onClick={signOut}><LogOut size={18} />Cerrar sesión</button>
          <Link to="/" className="admin-navitem"><Store size={18} />Ver tienda</Link>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <button className="topbar-burger" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="topbar-label">Panel de administración</span>
          {!hasSupabase && <span className="topbar-mode">modo demo</span>}
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}