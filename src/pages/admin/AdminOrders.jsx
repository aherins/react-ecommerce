import React, { useState } from 'react'
import { Eye, X, Truck, Search } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import Portal from '../../components/Portal'
import './AdminTable.css'
import './AdminOrders.css'

const STATUS_OPTIONS = ['pending','processing','shipped','delivered','cancelled']
const STATUS_LABEL   = { pending:'Pendiente', processing:'En preparación', shipped:'Enviado', delivered:'Entregado', cancelled:'Cancelado' }

export default function AdminOrders() {
  const { orders, products, dispatch } = useStore()
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) &&
        !(o.email || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function updateStatus(orderId, status) {
    dispatch({ type: 'ORDER_UPDATE', id: orderId, patch: { status } })
    if (selected?.id === orderId) setSelected(s => ({ ...s, status }))
  }

  function addTracking(orderId, trackingNumber) {
    dispatch({ type: 'ORDER_UPDATE', id: orderId, patch: { trackingNumber } })
    if (selected?.id === orderId) setSelected(s => ({ ...s, trackingNumber }))
  }

  const items = selected
    ? (selected.items || []).map(i => ({ ...i, product: products.find(p => p.id === i.productId) })).filter(i => i.product)
    : []

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-sub">{orders.length} pedidos en total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="filter-tabs">
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} className={`filter-tab ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
              <span className="filter-count">
                {s === 'all' ? orders.length : orders.filter(o => o.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <div className="orders-search">
          <Search size={15}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por ref. o email…"/>
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Referencia</th><th>Fecha</th><th>Email</th><th>Total</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:'center',padding:'40px',color:'var(--muted)'}}>Sin pedidos</td></tr>
            )}
            {filtered.map(o => (
              <tr key={o.id}>
                <td><code className="slug-pill">#{o.id.slice(-8).toUpperCase()}</code></td>
                <td>{new Date(o.createdAt).toLocaleDateString('es-ES')}</td>
                <td style={{color:'var(--muted)',fontSize:13}}>{o.email || '—'}</td>
                <td><strong>{o.total?.toFixed(2)} €</strong></td>
                <td>
                  <select
                    className={`status-select status-${o.status}`}
                    value={o.status}
                    onChange={e => updateStatus(o.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td>
                  <button className="action-btn edit" onClick={() => setSelected(o)} title="Ver detalle">
                    <Eye size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order detail modal */}
      {selected && (
        <Portal><div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal order-modal">
            <div className="modal-header">
              <h2>Pedido #{selected.id.slice(-8).toUpperCase()}</h2>
              <button onClick={() => setSelected(null)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div className="order-meta">
                <div className="order-meta-item">
                  <span>Fecha</span><strong>{new Date(selected.createdAt).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</strong>
                </div>
                <div className="order-meta-item">
                  <span>Email</span><strong>{selected.email || '—'}</strong>
                </div>
                <div className="order-meta-item">
                  <span>Estado</span>
                  <select className={`status-select status-${selected.status}`} value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div className="order-meta-item">
                  <span>Pago</span>
                  <strong>{selected.paymentId
                    ? selected.paymentId.startsWith('sim_') ? '✓ Simulado' : '✓ Stripe'
                    : '—'}</strong>
                </div>
              </div>

              <TrackingInput order={selected} onSave={tn => addTracking(selected.id, tn)}/>

              <h3 className="order-items-title">Artículos</h3>
              {items.map(({ product, qty, productId }) => (
                <div key={productId} className="order-item-row">
                  <img src={product.image} alt={product.name}/>
                  <div className="order-item-info">
                    <p>{product.name}</p>
                    <p className="order-item-qty">× {qty}</p>
                  </div>
                  <p className="order-item-price">{(product.price * qty).toFixed(2)} €</p>
                </div>
              ))}

              <div className="order-total-row">
                <span>Total</span>
                <strong>{selected.total?.toFixed(2)} €</strong>
              </div>
            </div>
          </div>
        </div>
      </Portal>
      )}
    </div>
  )
}

function TrackingInput({ order, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(order.trackingNumber || '')
  return (
    <div className="tracking-input-row">
      <Truck size={15} color="var(--muted)"/>
      {editing ? (
        <>
          <input className="tracking-text-input" value={value} onChange={e=>setValue(e.target.value)} placeholder="Nº de seguimiento transportista"/>
          <button className="track-save-btn" onClick={() => { onSave(value); setEditing(false) }}>Guardar</button>
          <button className="track-cancel-btn" onClick={() => setEditing(false)}>Cancelar</button>
        </>
      ) : (
        <>
          <span style={{fontSize:13,color:'var(--muted)'}}>
            {order.trackingNumber ? <strong style={{color:'var(--ink)'}}>{order.trackingNumber}</strong> : 'Sin número de seguimiento'}
          </span>
          <button className="track-edit-btn" onClick={() => setEditing(true)}>
            {order.trackingNumber ? 'Editar' : 'Añadir'}
          </button>
        </>
      )}
    </div>
  )
}
