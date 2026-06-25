import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { canAddToCart } from '../context/store/stock'
import './ProductCard.css'

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
    <Link to={`/producto/${product.id}`} className="product-card">
      <div className="product-card-img">
        <img src={product.image} alt={product.name} loading="lazy" />
        <button
          className={`product-card-wish ${inWishlist ? 'active' : ''}`}
          onClick={handleWish}
          aria-label="Lista de deseos"
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>
        <button className="product-card-cta" onClick={handleAdd} disabled={!canAdd}>
          <ShoppingBag size={16} /><span>{canAdd ? 'Añadir' : 'Sin stock'}</span>
        </button>
      </div>
      <div className="product-card-info">
        <p className="product-card-name">{product.name}</p>
        <p className="product-card-price">{product.price.toFixed(2)} €</p>
      </div>
    </Link>
  )
}
