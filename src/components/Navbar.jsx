import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Menu, X, Settings, Heart, User, ChevronDown } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { getRootCategories, getChildCategories, getPathToCategory } from '../lib/categories'
import './Navbar.css'

function NavCategoryBranch({ categories, category, onNavigate, depth = 0 }) {
  const children = getChildCategories(categories, category.id)
  const path = getPathToCategory(categories, category.id)

  if (children.length === 0) {
    return (
      <Link to={`/?path=${path}`} onClick={onNavigate}>
        {category.name}
      </Link>
    )
  }

  return (
    <div className={`navbar-cat-group ${depth > 0 ? 'navbar-cat-group--nested' : ''}`}>
      <Link to={`/?path=${path}`} onClick={onNavigate} className="navbar-cat-parent">
        {category.name}
        <ChevronDown size={14} className="navbar-cat-chevron"/>
      </Link>
      <div className="navbar-subcats">
        {children.map(child => (
          <NavCategoryBranch
            key={child.id}
            categories={categories}
            category={child}
            onNavigate={onNavigate}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  )
}

export default function Navbar() {
  const { cartCount, wishlist, categories } = useStore()
  const { hasAdminAccess } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const roots = getRootCategories(categories)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">ARTESANA</Link>

        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={closeMenu}>Tienda</Link>
          {roots.map(c => (
            <NavCategoryBranch
              key={c.id}
              categories={categories}
              category={c}
              onNavigate={closeMenu}
            />
          ))}
          <Link to="/contacto" onClick={closeMenu}>Contacto</Link>
          <Link to="/seguimiento" onClick={closeMenu}>Seguimiento</Link>
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
