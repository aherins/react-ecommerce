import React from 'react'
import { Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { ORDER_STATUS_LABEL } from '../lib/orders'
import './OrderCard.css'

const STEPS = [
  { key: 'pending',    label: 'Pedido recibido', icon: Clock,        desc: 'Tu pedido ha sido confirmado y está siendo revisado.' },
  { key: 'processing', label: 'En preparación',  icon: Package,      desc: 'Estamos preparando y empaquetando tu pedido.' },
  { key: 'shipped',    label: 'En camino',        icon: Truck,        desc: 'Tu pedido ha salido de nuestras instalaciones.' },
  { key: 'delivered',  label: 'Entregado',        icon: CheckCircle,  desc: '¡Tu pedido ha sido entregado con éxito!' },
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
              <div className="tl-dot"><step.icon size={16}/></div>
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

export default function OrderCard({ order, products, compact = false }) {
  const items = (order.items || []).map(i => ({
    ...i, product: products.find(p => p.id === i.productId),
  })).filter(i => i.product)

  return (
    <div className="tracking-card">
      <div className="tracking-card-header">
        <div>
          <p className="tracking-ref">Pedido #{order.id.slice(-8).toUpperCase()}</p>
          <p className="tracking-date">
            {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`status-badge ${order.status}`}>
          {ORDER_STATUS_LABEL[order.status] || order.status}
        </span>
      </div>

      {!compact && order.status !== 'cancelled' && <Timeline status={order.status}/>}

      {!compact && order.status === 'cancelled' && (
        <div className="tracking-cancelled">
          <AlertCircle size={20}/> Este pedido fue cancelado.
        </div>
      )}

      {order.trackingNumber && (
        <div className="tracking-number-row">
          <Truck size={16}/>
          <span>Nº de seguimiento: <strong>{order.trackingNumber}</strong></span>
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
