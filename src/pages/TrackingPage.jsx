import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Truck, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import OrderCard from '../components/OrderCard'
import { useStore } from '../context/StoreContext'
import './TrackingPage.css'

export default function TrackingPage() {
  const { orderId }    = useParams()
  const navigate       = useNavigate()
  const { orders, products } = useStore()
  const [query, setQuery]    = useState(orderId || '')
  const [searched, setSearched] = useState(Boolean(orderId))

  const found = searched
    ? orders.filter(o =>
        o.id?.toLowerCase().includes(query.toLowerCase()) ||
        o.id?.slice(-8).toUpperCase() === query.toUpperCase()
      )
    : []

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearched(true)
    navigate(`/seguimiento/${query.trim()}`, { replace: true })
  }

  return (
    <div>
      <Navbar/>
      <main className="tracking-main">
        <div className="tracking-inner">
          <div className="tracking-hero">
            <Truck size={28} color="var(--accent)"/>
            <h1>Seguimiento de pedido</h1>
            <p>Introduce el número de referencia de tu pedido para ver el estado del envío.</p>
          </div>

          <form className="tracking-search" onSubmit={handleSearch}>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSearched(false) }}
              placeholder="Ej: A1B2C3D4 o el ID completo"
            />
            <button type="submit"><Search size={18}/>Buscar</button>
          </form>

          {searched && found.length === 0 && (
            <div className="tracking-not-found">
              <AlertCircle size={32} color="var(--muted)"/>
              <p>No se encontró ningún pedido con esa referencia.</p>
              <p className="tracking-hint">Comprueba que el número es correcto o revisa el email de confirmación.</p>
            </div>
          )}

          {found.length > 0 && (
            <div className="tracking-results">
              {found.map(o => <OrderCard key={o.id} order={o} products={products}/>)}
            </div>
          )}

          {!searched && orders.length > 0 && (
            <div className="tracking-recent">
              <h2>Pedidos recientes</h2>
              {orders.slice(0, 5).map(o => <OrderCard key={o.id} order={o} products={products}/>)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
