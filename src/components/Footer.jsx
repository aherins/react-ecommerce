import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} Artesana · <Link to="/admin">Admin</Link></p>
    </footer>
  )
}
