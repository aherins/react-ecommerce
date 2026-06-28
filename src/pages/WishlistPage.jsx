import React from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import WishlistCard from '../components/WishlistCard'
import './WishlistPage.css'

export default function WishlistPage() {
  const { wishlist, products, dispatch } = useStore()
  const items = (wishlist || []).map(id => products.find(p => p.id === id)).filter(Boolean)

  return (
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
                <WishlistCard
                  key={p.id}
                  product={p}
                  onRemove={() => dispatch({ type: 'WISHLIST_TOGGLE', productId: p.id })}
                />
              ))}
            </div>
          )}
        </div>
      </main>
  )
}
