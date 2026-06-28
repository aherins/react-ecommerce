import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Trash2, Bell, BellOff, CheckCircle } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useStockAlert } from '../hooks/useStockAlert'
import './WishlistStockAlert.css'

export default function WishlistCard({ product, onRemove }) {
  const { dispatch } = useStore()
  const outOfStock = product.stock === 0
  const alert = useStockAlert(product.id)
  const showBadge = outOfStock && alert.subscribed

  return (
    <div className="wishlist-card">
      <div className="wishlist-img-wrap">
        <Link to={`/producto/${product.id}`} className="wishlist-img">
          <img src={product.image} alt={product.name} />
        </Link>
        {showBadge && (
          <div className="wishlist-stock-badge" title={alert.email}>
            <CheckCircle size={14} aria-hidden="true"/>
            <span>Aviso activo</span>
            <button
              type="button"
              className="wishlist-stock-badge-cancel"
              onClick={(e) => { e.preventDefault(); alert.unsubscribe() }}
              disabled={alert.submitting}
              aria-label="Cancelar aviso de stock"
            >
              <BellOff size={12}/>
            </button>
          </div>
        )}
      </div>
      <div className="wishlist-info">
        <Link to={`/producto/${product.id}`}>
          <p className="wish-name">{product.name}</p>
        </Link>
        <p className="wish-price">{product.price.toFixed(2)} €</p>
      </div>
      <div className={`wishlist-actions ${!outOfStock || showBadge ? 'wishlist-actions--solo-remove' : ''}`}>
        {outOfStock ? (
          !showBadge && (
            alert.loading ? (
              <div className="wish-add-btn wish-add-btn--ghost" aria-busy="true">…</div>
            ) : alert.isAuthenticated ? (
              <button
                type="button"
                className="wish-add-btn"
                onClick={alert.subscribe}
                disabled={alert.submitting}
                title={alert.error || undefined}
              >
                <Bell size={15} aria-hidden="true"/>
                {alert.submitting ? 'Guardando…' : 'Avisar cuando haya stock'}
              </button>
            ) : (
              <form className="wishlist-stock-form" onSubmit={alert.subscribe}>
                <input
                  type="email"
                  value={alert.email}
                  onChange={e => { alert.setEmail(e.target.value); alert.setError('') }}
                  placeholder="tu@email.com"
                  required
                  aria-label="Email para aviso de stock"
                  className={alert.error ? 'has-error' : ''}
                  title={alert.error || undefined}
                />
                <button
                  type="submit"
                  className="wishlist-stock-bell-btn"
                  disabled={alert.submitting}
                  aria-label="Activar aviso de stock"
                  title={alert.error || 'Activar aviso'}
                >
                  <Bell size={15} aria-hidden="true"/>
                </button>
              </form>
            )
          )
        ) : (
          <button
            className="wish-add-btn"
            onClick={() => dispatch({ type: 'CART_ADD', productId: product.id })}
          >
            <ShoppingBag size={15}/>
            Añadir al carrito
          </button>
        )}
        <button
          className="wish-remove-btn"
          onClick={onRemove}
          aria-label="Quitar de la lista de deseos"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
