import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Heart, ShoppingBag, Truck, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import { ordersForUser, ORDER_STATUS_LABEL } from '../../lib/orders'
import './AccountDashboard.css'

export default function AccountDashboard() {
  const { user } = useAuth()
  const { orders, wishlist } = useStore()
  const navigate = useNavigate()

  const myOrders = useMemo(() => ordersForUser(orders, user), [orders, user])
  const pending  = myOrders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const name     = user?.user_metadata?.full_name?.split(' ')[0] || 'Hola'

  return (
    <>
      <div className="account-content-header">
        <h2>¡Hola, {name}!</h2>
        <p>Bienvenido a tu panel de cuenta</p>
      </div>

      <div className="account-stats-grid">
        <div className="account-stat-card">
          <Package size={20}/>
          <strong>{myOrders.length}</strong>
          <span>Pedidos totales</span>
        </div>
        <div className="account-stat-card">
          <Truck size={20}/>
          <strong>{pending}</strong>
          <span>En curso</span>
        </div>
        <div className="account-stat-card">
          <Heart size={20}/>
          <strong>{wishlist?.length || 0}</strong>
          <span>En lista de deseos</span>
        </div>
      </div>

      <div className="account-quick-actions">
        <Link to="/" className="account-action-btn primary">
          <ShoppingBag size={15}/> Ir a la tienda
        </Link>
        <Link to="/cuenta/pedidos" className="account-action-btn">
          <Package size={15}/> Ver pedidos
        </Link>
        <Link to="/deseos" className="account-action-btn">
          <Heart size={15}/> Mi lista de deseos
        </Link>
      </div>

      <div className="account-recent">
        <h3>Últimos pedidos</h3>
        {myOrders.length === 0 ? (
          <div className="account-recent-empty">
            <p>Aún no has hecho ningún pedido.</p>
            <Link to="/" className="account-action-btn primary">Explorar productos</Link>
          </div>
        ) : (
          <>
            {myOrders.slice(0, 5).map(o => (
              <div key={o.id} className="account-recent-row" onClick={() => navigate('/cuenta/pedidos')}>
                <div>
                  <p className="account-recent-ref">#{o.id.slice(-8).toUpperCase()}</p>
                  <p className="account-recent-date">
                    {new Date(o.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="account-recent-right">
                  <span className={`order-status-pill ${o.status}`}>
                    {ORDER_STATUS_LABEL[o.status] || o.status}
                  </span>
                  <span className="account-recent-total">{o.total?.toFixed(2)} €</span>
                </div>
              </div>
            ))}
            {myOrders.length > 5 && (
              <Link to="/cuenta/pedidos" className="account-action-btn" style={{ marginTop: 16 }}>
                Ver todos <ArrowRight size={14}/>
              </Link>
            )}
          </>
        )}
      </div>
    </>
  )
}
