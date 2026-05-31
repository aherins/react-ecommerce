import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Package, Truck, CheckCircle, Clock, MapPin, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useStore } from '../context/StoreContext'
import './TrackingPage.css'

const STEPS = [
  { key: 'pending',    label: 'Pedido recibido',    icon: Clock,        desc: 'Tu pedido ha sido confirmado y está siendo revisado.' },
  { key: 'processing', label: 'En preparación',     icon: Package,      desc: 'Estamos preparando y empaquetando tu pedido.' },
  { key: 'shipped',    label: 'En camino',           icon: Truck,        desc: 'Tu pedido ha salido de nuestras instalaciones.' },
  { key: 'delivered',  label: 'Entregado',           icon: CheckCircle,  desc: '¡Tu pedido ha sido entregado con éxito!' },
]

const STEP_INDEX = { pending: 0, processing: 1, shipped: 2, delivered: 3 }

function Timeline({ status }) {
  const currentIdx = STEP_INDEX[status] ?? 0
  return (
    <div className="timeline">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx
        const current = i === currentIdx
        return (
          <div key={step.key} className={`timeline-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
            <div className="tl-left">
              <div className="tl-dot">
                <step.icon size={16}/>
              </div>
              {i < STEPS.length - 1 && <div className="tl-line"/>}
            </div>
            <div className="tl-content">
              <p className="tl-label">{step.label}</p>
              <p className="tl-desc">{step.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OrderCard({ order, products }) {
  const items = (order.items || []).map(i => ({
    ...i, product: products.find(p => p.id === i.productId)
  })).filter(i => i.product)

  const statusLabel = { pending:'Pendiente', processing:'En preparación', shipped:'En camino', delivered:'Entregado', cancelled:'Cancelado' }

  return (
    <div className="tracking-card">
      <div className="tracking-card-header">
        <div>
          <p className="tracking-ref">Pedido #{order.id.slice(-8).toUpperCase()}</p>
          <p className="tracking-date">{new Date(order.createdAt).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        <span className={`status-badge ${order.status}`}>{statusLabel[order.status]}</span>
      </div>

      {order.status !== 'cancelled' && <Timeline status={order.status}/>}

      {order.status === 'cancelled' && (
        <div className="tracking-cancelled">
          <AlertCircle size={20}/> Este pedido fue cancelado.
        </div>
      )}

      {order.trackingNumber && (
        <div className="tracking-number-row">
          <Truck size={16}/>
          <span>Nº de seguimiento transportista: <strong>{order.trackingNumber}</strong></span>
        </div>
      )}

      <div className="tracking-items">
        <h3>Artículos</h3>
        {items.map(({ product, qty, productId }) => (
          <div key={productId} className="tracking-item">
            <img src={product.image} alt={product.name}/>
            <div>
              <p>{product.name}</p>
              <p className="tracking-item-qty">× {qty} · {(product.price * qty).toFixed(2)} €</p>
            </div>
          </div>
        ))}
      </div>

      <div className="tracking-total">
        <span>Total</span>
        <span>{order.total?.toFixed(2)} €</span>
      </div>
    </div>
  )
}

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
              <h2>Tus pedidos recientes</h2>
              {orders.slice(0, 5).map(o => <OrderCard key={o.id} order={o} products={products}/>)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
