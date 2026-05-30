import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Package } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useStore } from '../context/StoreContext'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { products, categories, dispatch } = useStore()
  const navigate = useNavigate()

  const product = products.find(p => p.id === id)
  if (!product) return (
    <div>
      <Navbar />
      <div className="notfound"><p>Producto no encontrado. <Link to="/">Volver</Link></p></div>
    </div>
  )

  const category = categories.find(c => c.id === product.categoryId)

  function handleAdd() {
    dispatch({ type: 'CART_ADD', productId: product.id })
    navigate('/carrito')
  }

  return (
    <div>
      <Navbar />
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
                disabled={product.stock === 0}
              >
                <ShoppingBag size={18} />
                {product.stock > 0 ? 'Añadir al carrito' : 'Sin stock'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
