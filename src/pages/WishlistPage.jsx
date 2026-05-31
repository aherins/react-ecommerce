import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useStore } from '../context/StoreContext'
import './WishlistPage.css'

export default function WishlistPage() {
  const { wishlist, products, dispatch } = useStore()
  const items = (wishlist || []).map(id => products.find(p => p.id === id)).filter(Boolean)

  return (
    <div>
      <Navbar />
      <main className="wishlist-main">
        <div className="wishlist-inner">
          <div className="page-header">
            <Heart size={24} color="#e44d8a" fill="#e44d8a" />
            <h1>Lista de deseos</h1>
          </div>

          {items.length === 0 ? (
            <div className="wishlist-empty">
              <Heart size={48} color="var(--border)" />
              <p>Tu lista de deseos está vacía.</p>
              <Link to="/" className="btn-primary">Explorar tienda</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {items.map(p => (
                <div key={p.id} className="wishlist-card">
                  <Link to={`/producto/${p.id}`} className="wishlist-img">
                    <img src={p.image} alt={p.name} />
                  </Link>
                  <div className="wishlist-info">
                    <Link to={`/producto/${p.id}`}>
                      <p className="wish-name">{p.name}</p>
                    </Link>
                    <p className="wish-price">{p.price.toFixed(2)} €</p>
                  </div>
                  <div className="wishlist-actions">
                    <button
                      className="wish-add-btn"
                      onClick={() => dispatch({ type: 'CART_ADD', productId: p.id })}
                      disabled={p.stock === 0}
                    >
                      <ShoppingBag size={15} />
                      {p.stock > 0 ? 'Añadir al carrito' : 'Sin stock'}
                    </button>
                    <button
                      className="wish-remove-btn"
                      onClick={() => dispatch({ type: 'WISHLIST_TOGGLE', productId: p.id })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
