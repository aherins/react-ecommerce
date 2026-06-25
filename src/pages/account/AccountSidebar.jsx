import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, Heart, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AccountSidebar() {
  const { user, signOut } = useAuth()
  const name   = user?.user_metadata?.full_name || user?.email || 'Usuario'
  const avatar = user?.user_metadata?.avatar_url

  return (
    <aside className="account-sidebar">
      <div className="account-profile">
        {avatar
          ? <img src={avatar} alt={name} className="account-avatar" referrerPolicy="no-referrer"/>
          : <div className="account-avatar-placeholder"><User size={24}/></div>}
        <div>
          <h1>{name}</h1>
          <p>{user?.email}</p>
        </div>
      </div>

      <nav className="account-nav">
        <NavLink to="/cuenta" end className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={16}/> Resumen
        </NavLink>
        <NavLink to="/cuenta/perfil" className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}>
          <User size={16}/> Mi perfil
        </NavLink>
        <NavLink to="/cuenta/pedidos" className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}>
          <Package size={16}/> Mis pedidos
        </NavLink>
        <NavLink to="/deseos" className={({ isActive }) => `account-nav-item ${isActive ? 'active' : ''}`}>
          <Heart size={16}/> Lista de deseos
        </NavLink>
      </nav>

      <button className="account-signout" onClick={signOut}>
        <LogOut size={16}/> Cerrar sesión
      </button>
    </aside>
  )
}
