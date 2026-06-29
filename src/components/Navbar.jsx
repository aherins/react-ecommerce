import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Menu, X, Settings, Heart, User, ChevronDown } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { getRootCategories, getChildCategories } from '../lib/categories'
import './Navbar.css'

export default function Navbar() {
  const { cartCount, wishlist, categories } = useStore()
  const { hasAdminAccess } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const roots = getRootCategories(categories)

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">ARTESANA</Link>

        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Tienda</Link>
          {roots.map(c => {
            const subs = getChildCategories(categories, c.id)
            if (subs.length === 0) {
              return (
                <Link key={c.id} to={`/?cat=${c.slug}`} onClick={() => setMenuOpen(false)}>
                  {c.name}
                </Link>
              )
            }
            return (
              <div key={c.id} className="navbar-cat-group">
                <Link to={`/?cat=${c.slug}`} onClick={() => setMenuOpen(false)} className="navbar-cat-parent">
                  {c.name}
                  <ChevronDown size={14} className="navbar-cat-chevron"/>
                </Link>
                <div className="navbar-subcats">
                  {subs.map(sub => (
                    <Link
                      key={sub.id}
                      to={`/?cat=${c.slug}&sub=${sub.slug}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
          <Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link>
          <Link to="/seguimiento" onClick={() => setMenuOpen(false)}>Seguimiento</Link>
        </nav>

        <div className="navbar-actions">
          <Link to="/deseos" className="navbar-icon-btn" aria-label="Lista de deseos">
            <Heart size={20} />
            {wishlist?.length > 0 && <span className="icon-badge wish-badge">{wishlist.length}</span>}
          </Link>
          <Link to="/cuenta" className="navbar-icon-btn" aria-label="Mi cuenta">
            <User size={20} />
          </Link>
          <Link to="/carrito" className="navbar-icon-btn" aria-label="Carrito">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
          </Link>
          {hasAdminAccess && (
            <Link to="/admin" className="navbar-icon-btn navbar-admin" title="Admin">
              <Settings size={18} />
            </Link>
          )}
          <button className="navbar-burger" onClick={() => setMenuOpen(o => !o)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
