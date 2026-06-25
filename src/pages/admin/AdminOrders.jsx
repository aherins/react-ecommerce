import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, X, Truck, Search, CheckCircle, Clock, ExternalLink, Package } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import Portal from '../../components/Portal'
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_LABEL,
  sortOrdersByDate,
} from '../../lib/admin'
import './AdminTable.css'
import './AdminOrders.css'

export default function AdminOrders() {
  const { orders, products, dispatch } = useStore()
  const { userCan } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const canEditStatus = userCan('pedidos.estado')
  const canEditTracking = userCan('pedidos.tracking')

  const sortedOrders = useMemo(() => sortOrdersByDate(orders), [orders])

  useEffect(() => {
    const openId = location.state?.openOrderId
    if (!openId) return
    const order = sortedOrders.find(o => o.id === openId)
    if (order) setSelected(order)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, sortedOrders, navigate, location.pathname])

  const filtered = sortedOrders.filter(o => {
    if (filterStatus === 'to_ship') {
      if (o.status !== 'pending' && o.status !== 'processing') return false
    } else if (filterStatus !== 'all' && o.status !== filterStatus) {
      return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!o.id.toLowerCase().includes(q) && !(o.email || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const toShipCount = sortedOrders.filter(
    o => o.status === 'pending' || o.status === 'processing'
  ).length
  const shippedCount = sortedOrders.filter(o => o.status === 'shipped').length
  const deliveredCount = sortedOrders.filter(o => o.status === 'delivered').length

  function updateStatus(orderId, status) {
    if (!canEditStatus) return
    dispatch({ type: 'ORDER_UPDATE', id: orderId, patch: { status } })
    if (selected?.id === orderId) setSelected(s => ({ ...s, status }))
  }

  function addTracking(orderId, trackingNumber) {
    if (!canEditTracking) return
    dispatch({ type: 'ORDER_UPDATE', id: orderId, patch: { trackingNumber } })
    if (selected?.id === orderId) setSelected(s => ({ ...s, trackingNumber }))
  }

  const items = selected
    ? (selected.items || []).map(i => ({ ...i, product: products.find(p => p.id === i.productId) })).filter(i => i.product)
    : []

  const filterTabs = [
    { key: 'all', label: 'Todos', count: sortedOrders.length },
    { key: 'to_ship', label: 'Por enviar', count: toShipCount },
    ...ORDER_STATUS_OPTIONS.map(s => ({
      key: s,
      label: ORDER_STATUS_LABEL[s],
      count: sortedOrders.filter(o => o.status === s).length,
    })),
  ]

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-sub">{sortedOrders.length} pedidos en total</p>
        </div>
      </div>

      <div className="shipping-kpis">
        <div className="shipping-kpi">
          <Clock size={20} color="#f59e0b"/>
          <div><p className="kpi-num">{toShipCount}</p><p className="kpi-label">Por enviar</p></div>
        </div>
        <div className="shipping-kpi">
          <Truck size={20} color="#0369a1"/>
          <div><p className="kpi-num">{shippedCount}</p><p className="kpi-label">En camino</p></div>
        </div>
        <div className="shipping-kpi">
          <CheckCircle size={20} color="var(--success)"/>
          <div><p className="kpi-num">{deliveredCount}</p><p className="kpi-label">Entregados</p></div>
        </div>
      </div>

      <div className="orders-filters">
        <div className="filter-tabs">
          {filterTabs.map(({ key, label, count }) => (
            count > 0 || key === 'all' || key === 'to_ship' ? (
              <button
                key={key}
                className={`filter-tab ${filterStatus === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="filter-count">{count}</span>
              </button>
            ) : null
          ))}
        </div>
        <div className="orders-search">
          <Search size={15}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por ref. o email…"/>
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <div className="admin-empty-state">
          <Package size={40} color="var(--border)"/>
          <h3>Sin pedidos</h3>
          <p>Cuando un cliente complete una compra, aparecerá aquí.</p>
          <Link to="/" className="btn-add">Ir a la tienda</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr>
              <th>Referencia</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="table-empty-row">Ningún pedido con este filtro</td></tr>
              )}
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <code className="slug-pill">#{o.id.slice(-8).toUpperCase()}</code>
                    {o.simulated && <span className="sim-badge">sim</span>}
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString('es-ES')}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{o.email || '—'}</td>
                  <td><strong>{o.total?.toFixed(2)} €</strong></td>
                  <td>
                    {canEditStatus ? (
                      <select
                        className={`status-select status-${o.status}`}
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                      >
                        {ORDER_STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`status-readonly status-${o.status}`}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="action-btn edit" onClick={() => setSelected(o)} title="Ver detalle">
                        <Eye size={14}/>
                      </button>
                      {canEditStatus && o.status === 'processing' && (
                        <button className="action-shipping-btn" onClick={() => updateStatus(o.id, 'shipped')} title="Marcar enviado">
                          <Truck size={14}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Portal>
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
            <div className="modal order-modal">
              <div className="modal-header">
                <h2>Pedido #{selected.id.slice(-8).toUpperCase()}</h2>
                <button onClick={() => setSelected(null)}><X size={20}/></button>
              </div>
              <div className="modal-body">
                <div className="order-meta">
                  <div className="order-meta-item">
                    <span>Fecha</span>
                    <strong>{new Date(selected.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </div>
                  <div className="order-meta-item">
                    <span>Email</span>
                    <strong>{selected.email || '—'}</strong>
                  </div>
                  <div className="order-meta-item">
                    <span>Estado</span>
                    {canEditStatus ? (
                      <select className={`status-select status-${selected.status}`} value={selected.status}
                        onChange={e => updateStatus(selected.id, e.target.value)}>
                        {ORDER_STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <strong>{ORDER_STATUS_LABEL[selected.status]}</strong>
                    )}
                  </div>
                  <div className="order-meta-item">
                    <span>Pago</span>
                    <strong>{selected.simulated ? 'Simulado' : selected.paymentId ? 'Stripe' : '—'}</strong>
                  </div>
                </div>

                {canEditTracking && (
                  <TrackingInput order={selected} onSave={tn => addTracking(selected.id, tn)}/>
                )}

                <Link to={`/seguimiento/${selected.id}`} className="order-tracking-link" target="_blank" rel="noreferrer">
                  <ExternalLink size={14}/> Ver seguimiento público
                </Link>

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

                {canEditStatus && (selected.status === 'pending' || selected.status === 'processing') && (
                  <button className="btn-save order-ship-btn" onClick={() => updateStatus(selected.id, 'shipped')}>
                    <Truck size={16}/> Marcar como enviado
                  </button>
                )}
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
  const [value, setValue] = useState(order.trackingNumber || '')
  return (
    <div className="tracking-input-row">
      <Truck size={15} color="var(--muted)"/>
      {editing ? (
        <>
          <input className="tracking-text-input" value={value} onChange={e => setValue(e.target.value)} placeholder="Nº de seguimiento transportista"/>
          <button className="track-save-btn" onClick={() => { onSave(value); setEditing(false) }}>Guardar</button>
          <button className="track-cancel-btn" onClick={() => setEditing(false)}>Cancelar</button>
        </>
      ) : (
        <>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            {order.trackingNumber
              ? <strong style={{ color: 'var(--ink)' }}>{order.trackingNumber}</strong>
              : 'Sin número de seguimiento'}
          </span>
          <button className="track-edit-btn" onClick={() => setEditing(true)}>
            {order.trackingNumber ? 'Editar' : 'Añadir'}
          </button>
        </>
      )}
    </div>
  )
}
