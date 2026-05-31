import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { Store, Menu, X, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { navForRole, ROLE_LABELS, ROLE_COLORS } from '../../lib/roles'
import Login from './Login'
import './AdminLayout.css'

function RoleBadge({ role }) {
  if (!role) return null
  const { bg, color, border } = ROLE_COLORS[role] || {}
  return (
    <span className="role-badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
      {ROLE_LABELS[role] || role}
    </span>
  )
}

function UserChip({ user, role }) {
  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || ''
  return (
    <div className="admin-user">
      <div className="admin-user-top">
        {avatar ? (
          <img src={avatar} alt={name} className="admin-avatar" referrerPolicy="no-referrer" />
        ) : (
          <div className="admin-avatar-placeholder"><User size={14} /></div>
        )}
        <span className="admin-user-name" title={name}>{name}</span>
      </div>
      <RoleBadge role={role} />
    </div>
  )
}

// Componente que protege rutas por permiso
export function RequirePermission({ permission, children }) {
  const { userCan } = useAuth()
  if (!userCan(permission)) {
    return (
      <div className="permission-denied">
        <span className="denied-icon">🔒</span>
        <h2>Acceso denegado</h2>
        <p>Tu rol no tiene permiso para acceder a esta sección.</p>
      </div>
    )
  }
  return children
}

export default function AdminLayout() {
  const { user, role, loading, signOut, hasAdminAccess, hasSupabase } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) return <div className="admin-loading"><span className="spinner dark" /></div>
  if (!user || !hasAdminAccess) return <Login />

  const navItems = navForRole(role)

  return (
    <div className="admin-root">
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <span>ARTESANA</span>
          <button className="sidebar-close" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <nav className="admin-nav">
          {navItems.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `admin-navitem ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <n.icon size={18} />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-nav-footer">
          <UserChip user={user} role={role} />
          <button className="admin-navitem signout" onClick={signOut}>
            <LogOut size={18} />Cerrar sesión
          </button>
          <Link to="/" className="admin-navitem">
            <Store size={18} />Ver tienda
          </Link>
        </div>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <button className="topbar-burger" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <span className="topbar-label">Panel de administración</span>
          <div className="topbar-right">
            {!hasSupabase && <span className="topbar-mode">modo demo</span>}
            <RoleBadge role={role} />
          </div>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}
