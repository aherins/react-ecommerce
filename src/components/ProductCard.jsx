import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart, Bell, BellOff, CheckCircle } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { canAddToCart } from '../context/store/stock'
import { useStockAlert } from '../hooks/useStockAlert'
import './ProductCard.css'

function stopNav(e) {
  e.preventDefault()
  e.stopPropagation()
}

function ProductCardStockAlert({ productId }) {
  const alert = useStockAlert(productId)

  if (alert.loading) {
    return (
      <span className="product-card-out product-card-out--static">
        <Bell size={14} aria-hidden="true"/>
        <span>Avisar cuando haya stock</span>
      </span>
    )
  }

  if (alert.subscribed) {
    return (
      <div
        className="product-card-stock-badge"
        onClick={stopNav}
        title={alert.email}
      >
        <CheckCircle size={13} aria-hidden="true"/>
        <span>Aviso activo</span>
        <button
          type="button"
          className="product-card-stock-badge-cancel"
          onClick={(e) => { stopNav(e); alert.unsubscribe() }}
          disabled={alert.submitting}
          aria-label="Cancelar aviso de stock"
        >
          <BellOff size={11}/>
        </button>
      </div>
    )
  }

  if (alert.isAuthenticated) {
    return (
      <button
        type="button"
        className="product-card-out product-card-out--btn"
        onClick={(e) => { stopNav(e); alert.subscribe(e) }}
        disabled={alert.submitting}
        title={alert.error || undefined}
      >
        <Bell size={14} aria-hidden="true"/>
        <span>{alert.submitting ? 'Guardando…' : 'Avisar cuando haya stock'}</span>
      </button>
    )
  }

  return (
    <form
      className="product-card-stock-form"
      onSubmit={(e) => { stopNav(e); alert.subscribe(e) }}
      onClick={stopNav}
    >
      <div className={`product-card-stock-field ${alert.error ? 'has-error' : ''}`}>
        <input
          type="email"
          value={alert.email}
          onChange={e => { alert.setEmail(e.target.value); alert.setError('') }}
          placeholder="tu@email.com"
          required
          aria-label="Email para aviso de stock"
          title={alert.error || undefined}
        />
        <button
          type="submit"
          className="product-card-stock-bell"
          disabled={alert.submitting}
          aria-label="Activar aviso de stock"
          title={alert.error || 'Activar aviso'}
        >
          <Bell size={13} aria-hidden="true"/>
        </button>
      </div>
    </form>
  )
}

export default function ProductCard({ product }) {
  const { dispatch, wishlist, cart } = useStore()
  const inWishlist = wishlist?.includes(product.id)
  const canAdd = canAddToCart(product, cart)

  function handleAdd(e) {
    e.preventDefault()
    if (!canAdd) return
    dispatch({ type: 'CART_ADD', productId: product.id })
  }
  function handleWish(e) {
    e.preventDefault()
    dispatch({ type: 'WISHLIST_TOGGLE', productId: product.id })
  }

  return (
    <Link to={`/producto/${product.id}`} className={`product-card ${!canAdd ? 'product-card--out' : ''}`}>
      <div className="product-card-img">
        <img src={product.image} alt={product.name} loading="lazy" />
        <button
          className={`product-card-wish ${inWishlist ? 'active' : ''}`}
          onClick={handleWish}
          aria-label="Lista de deseos"
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
        {canAdd ? (
          <button className="product-card-cta" onClick={handleAdd}>
            <ShoppingBag size={16} /><span>Añadir</span>
          </button>
        ) : (
          <ProductCardStockAlert productId={product.id} />
        )}
      </div>
      <div className="product-card-info">
        <p className="product-card-name">{product.name}</p>
        <p className="product-card-price">{product.price.toFixed(2)} €</p>
      </div>
    </Link>
  )
}
