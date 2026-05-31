import React from 'react'
import { Truck, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import './AdminTable.css'
import './AdminOrders.css'

const STATUS_LABEL = { pending:'Pendiente', processing:'En preparación', shipped:'Enviado', delivered:'Entregado', cancelled:'Cancelado' }

export default function AdminShipping() {
  const { orders, products, dispatch } = useStore()

  const pending  = orders.filter(o => o.status === 'processing')
  const shipped  = orders.filter(o => o.status === 'shipped')
  const delivered= orders.filter(o => o.status === 'delivered')

  function markShipped(orderId) {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: 'shipped' } : o)
    dispatch({ type: 'SET_ORDERS', orders: updated })
  }
  function markDelivered(orderId) {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o)
    dispatch({ type: 'SET_ORDERS', orders: updated })
  }
  function saveTracking(orderId, tn) {
    const updated = orders.map(o => o.id === orderId ? { ...o, trackingNumber: tn } : o)
    dispatch({ type: 'SET_ORDERS', orders: updated })
  }

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de envíos</h1>
          <p className="page-sub">Control de estado y seguimiento de envíos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="shipping-kpis">
        <div className="shipping-kpi">
          <Clock size={20} color="#f59e0b"/>
          <div><p className="kpi-num">{pending.length}</p><p className="kpi-label">Pendientes de enviar</p></div>
        </div>
        <div className="shipping-kpi">
          <Truck size={20} color="#0369a1"/>
          <div><p className="kpi-num">{shipped.length}</p><p className="kpi-label">En camino</p></div>
        </div>
        <div className="shipping-kpi">
          <CheckCircle size={20} color="var(--success)"/>
          <div><p className="kpi-num">{delivered.length}</p><p className="kpi-label">Entregados</p></div>
        </div>
      </div>

      {/* Pending to ship */}
      {pending.length > 0 && (
        <section className="shipping-section">
          <h2 className="shipping-section-title"><AlertCircle size={16} color="#f59e0b"/>Listos para enviar</h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Ref.</th><th>Productos</th><th>Total</th><th>Seguimiento</th><th>Acción</th></tr></thead>
              <tbody>
                {pending.map(o => (
                  <ShippingRow key={o.id} order={o} products={products}
                    onMarkShipped={() => markShipped(o.id)}
                    onSaveTracking={tn => saveTracking(o.id, tn)}
                    actionLabel="Marcar como enviado"
                    actionColor="var(--success)"
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* In transit */}
      {shipped.length > 0 && (
        <section className="shipping-section">
          <h2 className="shipping-section-title"><Truck size={16} color="#0369a1"/>En tránsito</h2>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Ref.</th><th>Productos</th><th>Total</th><th>Seguimiento</th><th>Acción</th></tr></thead>
              <tbody>
                {shipped.map(o => (
                  <ShippingRow key={o.id} order={o} products={products}
                    onMarkShipped={() => markDelivered(o.id)}
                    onSaveTracking={tn => saveTracking(o.id, tn)}
                    actionLabel="Marcar como entregado"
                    actionColor="#0369a1"
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {pending.length === 0 && shipped.length === 0 && (
        <div className="shipping-empty">
          <CheckCircle size={48} color="var(--border)"/>
          <p>No hay envíos pendientes de gestionar.</p>
        </div>
      )}
    </div>
  )
}

function ShippingRow({ order, products, onMarkShipped, onSaveTracking, actionLabel, actionColor }) {
  const [trackVal, setTrackVal] = React.useState(order.trackingNumber || '')
  const [editing,  setEditing]  = React.useState(false)
  const items = (order.items||[]).map(i=>products.find(p=>p.id===i.productId)).filter(Boolean)

  return (
    <tr>
      <td><code className="slug-pill">#{order.id.slice(-8).toUpperCase()}</code></td>
      <td>
        <div className="shipping-thumbs">
          {items.slice(0,3).map((p,i) => <img key={i} src={p.image} alt={p.name} title={p.name}/>)}
          {items.length > 3 && <span className="shipping-more">+{items.length-3}</span>}
        </div>
      </td>
      <td><strong>{order.total?.toFixed(2)} €</strong></td>
      <td>
        {editing ? (
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input className="tracking-text-input" value={trackVal} onChange={e=>setTrackVal(e.target.value)} placeholder="Nº seguimiento" style={{border:'1px solid var(--border)',borderRadius:4,padding:'4px 8px',fontSize:13}}/>
            <button className="track-save-btn" onClick={()=>{onSaveTracking(trackVal);setEditing(false)}}>✓</button>
            <button className="track-cancel-btn" onClick={()=>setEditing(false)}>✗</button>
          </div>
        ) : (
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:13,color:trackVal?'var(--ink)':'var(--muted)'}}>{trackVal||'—'}</span>
            <button className="track-edit-btn" onClick={()=>setEditing(true)}>✎</button>
          </div>
        )}
      </td>
      <td>
        <button
          className="action-shipping-btn"
          style={{'--btn-color': actionColor}}
          onClick={onMarkShipped}
        >
          {actionLabel}
        </button>
      </td>
    </tr>
  )
}
