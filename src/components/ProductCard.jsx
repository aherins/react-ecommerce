import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { dispatch, wishlist } = useStore()
  const inWishlist = wishlist?.includes(product.id)

  function handleAdd(e) {
    e.preventDefault()
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
        <button className="product-card-cta" onClick={handleAdd}>
          <ShoppingBag size={16} /><span>Añadir</span>
        </button>
      </div>
      <div className="product-card-info">
        <p className="product-card-name">{product.name}</p>
        <p className="product-card-price">{product.price.toFixed(2)} €</p>
      </div>
    </Link>
  )
}
