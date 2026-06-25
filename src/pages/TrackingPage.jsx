import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Truck, AlertCircle, Mail } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import OrderCard from '../components/OrderCard'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { orderFromDb } from '../context/store/orderMappers'
import { hasSupabase } from '../lib/supabase'
import './TrackingPage.css'

export default function TrackingPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { products, orders, shippingCarriers } = useStore()
  const { user } = useAuth()
  const [query, setQuery] = useState(orderId || '')
  const [email, setEmail] = useState(user?.email || '')
  const [found, setFound] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setFound(null)
    setSearched(true)
    navigate(`/seguimiento/${query.trim()}`, { replace: true })

    if (hasSupabase && email.trim()) {
      try {
        const res = await fetch('/api/order-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: query.trim(), email: email.trim() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setFound([orderFromDb(data.order)])
      } catch (err) {
        setError(err.message)
      }
      setLoading(false)
      return
    }

    const local = orders.filter(o =>
      o.id?.toLowerCase().includes(query.toLowerCase()) ||
      o.id?.slice(-8).toUpperCase() === query.toUpperCase()
    )
    if (email.trim()) {
      setFound(local.filter(o => o.email?.toLowerCase() === email.trim().toLowerCase()))
    } else {
      setFound(local)
    }
    if (!local.length) setError('No se encontró el pedido. Introduce también el email usado en la compra.')
    setLoading(false)
  }

  return (
    <main className="tracking-main">
      <PageMeta title="Seguimiento de pedido" description="Consulta el estado de tu pedido en Artesana"/>
      <div className="tracking-inner">
        <div className="tracking-hero">
          <Truck size={28} color="var(--accent)"/>
          <h1>Seguimiento de pedido</h1>
          <p>Introduce la referencia y el email de la compra.</p>
        </div>

        <form className="tracking-search" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Referencia del pedido"
            required
          />
          <div className="tracking-email-wrap">
            <Mail size={16}/>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email de la compra"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            <Search size={18}/>{loading ? 'Buscando…' : 'Buscar'}
          </button>
        </form>

        {searched && error && !found?.length && (
          <div className="tracking-not-found">
            <AlertCircle size={32} color="var(--muted)"/>
            <p>{error}</p>
          </div>
        )}

        {found?.length > 0 && (
          <div className="tracking-results">
            {found.map(o => (
              <OrderCard key={o.id} order={o} products={products} shippingCarriers={shippingCarriers}/>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
