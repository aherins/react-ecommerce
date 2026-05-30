import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { dispatch } = useStore()

  function handleAdd(e) {
    e.preventDefault()
    dispatch({ type: 'CART_ADD', productId: product.id })
  }

  return (
    <Link to={`/producto/${product.id}`} className="product-card">
      <div className="product-card-img">
        <img src={product.image} alt={product.name} loading="lazy" />
        <button className="product-card-cta" onClick={handleAdd} aria-label="Añadir al carrito">
          <ShoppingBag size={16} />
          <span>Añadir</span>
        </button>
      </div>
      <div className="product-card-info">
        <p className="product-card-name">{product.name}</p>
        <p className="product-card-price">{product.price.toFixed(2)} €</p>
      </div>
    </Link>
  )
}
