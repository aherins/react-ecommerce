import React from 'react'
import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'

export default function NotFoundPage() {
  return (
    <main className="legal-main" style={{ textAlign: 'center' }}>
      <PageMeta title="Página no encontrada"/>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48 }}>404</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Esta página no existe.</p>
      <Link to="/" className="btn-primary">Ir a la tienda</Link>
    </main>
  )
}
