import React, { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Package } from 'lucide-react'
import RecentActivity from '../components/RecentActivity'
import { useAuth } from '../context/AuthContext'
import { activity } from '../lib/activity'
import { useStore } from '../context/StoreContext'
import { canAddToCart } from '../context/store/stock'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { products, categories, dispatch, cart } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const product = products.find(p => p.id === id)
  if (!product) return (
    <div className="notfound"><p>Producto no encontrado. <Link to="/">Volver</Link></p></div>
  )

  const category = categories.find(c => c.id === product.categoryId)
  const canAdd = canAddToCart(product, cart)

  // Registrar visita al producto
  useEffect(() => {
    if (product?.id) activity.trackView(product.id, user?.id)
  }, [product?.id, user?.id])

  function handleAdd() {
    if (!canAdd) return
    dispatch({ type: 'CART_ADD', productId: product.id })
    navigate('/carrito')
  }

  return (
    <main className="detail-main">
        <div className="detail-inner">
          <button className="detail-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>

          <div className="detail-layout">
            <div className="detail-image">
              <img src={product.image} alt={product.name} />
            </div>

            <div className="detail-info">
              {category && <span className="detail-cat">{category.name}</span>}
              <h1 className="detail-name">{product.name}</h1>
              <p className="detail-price">{product.price.toFixed(2)} €</p>
              <p className="detail-desc">{product.description}</p>

              <div className="detail-stock">
                <Package size={14} />
                <span>{product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock'}</span>
              </div>

              <button
                className="detail-add"
                onClick={handleAdd}
                disabled={!canAdd}
              >
                <ShoppingBag size={18} />
                {canAdd ? 'Añadir al carrito' : 'Sin stock'}
              </button>
            </div>
          </div>
        </div>

        {/* Vistos recientemente */}
        <div style={{marginTop: '48px'}}>
          <RecentActivity variant="sidebar" excludeId={product.id} />
        </div>
      </main>
  )
}
