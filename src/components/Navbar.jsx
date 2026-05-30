import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X, Settings } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import './Navbar.css'

export default function Navbar() {
  const { cartCount, categories } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">ARTESANA</Link>

        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Tienda</Link>
          {categories.map(c => (
            <Link key={c.id} to={`/?cat=${c.slug}`} onClick={() => setMenuOpen(false)}>{c.name}</Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <Link to="/carrito" className="navbar-cart" aria-label="Carrito">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <Link to="/admin" className="navbar-admin" title="Administración">
            <Settings size={18} />
          </Link>
          <button className="navbar-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  )
}
