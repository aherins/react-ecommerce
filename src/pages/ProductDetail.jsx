import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Package, Heart, Minus, Plus } from 'lucide-react'
import PageMeta from '../components/PageMeta'
import RecentActivity from '../components/RecentActivity'
import ProductCard from '../components/ProductCard'
import { useAuth } from '../context/AuthContext'
import { activity } from '../lib/activity'
import { useStore } from '../context/StoreContext'
import { getCartQty } from '../context/store/stock'
import { getCategoryPath, getPathToCategory } from '../lib/categories'
import StockAlertForm from '../components/StockAlertForm'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { products, categories, dispatch, cart, wishlist, loading } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)

  const product = products.find(p => p.id === id)
  const categoryPath = product ? getCategoryPath(categories, product.categoryId) : []
  const inWishlist = wishlist?.includes(id)
  const cartQty = product ? getCartQty(cart, product.id) : 0
  const canAdd = product && product.stock > 0 && cartQty + qty <= product.stock
  const related = product
    ? products.filter(p => p.active && p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4)
    : []

  useEffect(() => {
    if (product?.id) activity.trackView(product.id, user?.id)
  }, [product?.id, user?.id])

  if (loading) {
    return <div className="detail-loading"><span className="spinner dark"/></div>
  }

  if (!product) {
    return (
      <div className="notfound">
        <PageMeta title="Producto no encontrado"/>
        <p>Producto no encontrado.</p>
        <Link to="/">Volver a la tienda</Link>
      </div>
    )
  }

  function handleAdd() {
    if (!canAdd) return
    for (let i = 0; i < qty; i++) {
      dispatch({ type: 'CART_ADD', productId: product.id })
    }
    navigate('/carrito')
  }

  function toggleWish() {
    dispatch({ type: 'WISHLIST_TOGGLE', productId: product.id })
    activity.trackWishlist(product.id, !inWishlist, user?.id)
  }

  const outOfStock = product.stock <= 0
  const maxQty = Math.max(0, product.stock - cartQty)

  return (
    <main className="detail-main">
      <PageMeta title={product.name} description={product.description}/>
      <div className="detail-inner">
        <button type="button" className="detail-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16}/> Volver
        </button>

        <div className="detail-layout">
          <div className="detail-image">
            <img src={product.image} alt={product.name}/>
          </div>

          <div className="detail-info">
            {categoryPath.length > 0 && (
              <nav className="detail-cat-path" aria-label="Categoría">
                {categoryPath.map((cat, i) => {
                  const partialPath = categoryPath.slice(0, i + 1).map(s => s.slug).join('/')
                  return (
                    <React.Fragment key={cat.id}>
                      {i > 0 && <span className="detail-cat-sep">›</span>}
                      <Link to={`/?path=${partialPath}`} className="detail-cat">{cat.name}</Link>
                    </React.Fragment>
                  )
                })}
              </nav>
            )}
            <h1 className="detail-name">{product.name}</h1>
            <p className="detail-price">{product.price.toFixed(2)} €</p>
            <p className="detail-desc">{product.description}</p>

            <div className={`detail-stock ${outOfStock ? 'detail-stock--out' : ''}`}>
              <Package size={14}/>
              <span>{product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock'}</span>
            </div>

            {outOfStock ? (
              <>
                <StockAlertForm productId={product.id} productName={product.name}/>
                <div className="detail-actions detail-actions--solo-wish">
                  <button type="button" className={`detail-wish ${inWishlist ? 'active' : ''}`} onClick={toggleWish} aria-label="Lista de deseos">
                    <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'}/>
                  </button>
                </div>
              </>
            ) : (
              <>
            <div className="detail-qty-row">
              <span>Cantidad</span>
              <div className="detail-qty-controls">
                <button type="button" aria-label="Menos" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>
                  <Minus size={14}/>
                </button>
                <span>{qty}</span>
                <button type="button" aria-label="Más" onClick={() => setQty(q => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>
                  <Plus size={14}/>
                </button>
              </div>
            </div>

            <div className="detail-actions">
              <button type="button" className="detail-add" onClick={handleAdd} disabled={!canAdd}>
                <ShoppingBag size={18}/>
                {canAdd ? 'Añadir al carrito' : 'Sin stock'}
              </button>
              <button type="button" className={`detail-wish ${inWishlist ? 'active' : ''}`} onClick={toggleWish} aria-label="Lista de deseos">
                <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'}/>
              </button>
            </div>
              </>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="detail-related">
            <h2>También te puede gustar</h2>
            <div className="product-grid compact">
              {related.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          </section>
        )}
      </div>

      <div className="detail-activity-wrap">
        <RecentActivity variant="sidebar" excludeId={product.id}/>
      </div>
    </main>
  )
}
