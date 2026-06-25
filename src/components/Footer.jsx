import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Footer.css'

export default function Footer() {
  const { hasAdminAccess } = useAuth()
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>ARTESANA</strong>
          <p>Artesanía contemporánea · Sevilla</p>
        </div>
        <nav className="footer-links" aria-label="Enlaces legales">
          <Link to="/legal/privacidad">Privacidad</Link>
          <Link to="/legal/terminos">Términos</Link>
          <Link to="/legal/devoluciones">Devoluciones</Link>
          <Link to="/contacto">Contacto</Link>
          {hasAdminAccess && <Link to="/admin">Panel</Link>}
        </nav>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} Artesana</p>
    </footer>
  )
}
