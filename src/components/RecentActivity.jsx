import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ShoppingBag, Search, X, ChevronRight } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { activity } from '../lib/activity'
import './RecentActivity.css'

// ─── Sección de productos vistos/añadidos ────────────────────────────────────
function ProductHistory({ ids, products, title, icon: Icon, emptyText }) {
  const items = ids
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 8)

  if (items.length === 0) return null

  return (
    <div className="activity-section">
      <div className="activity-section-header">
        <Icon size={16} />
        <h3>{title}</h3>
      </div>
      <div className="activity-product-scroll">
        {items.map(p => (
          <Link key={p.id} to={`/producto/${p.id}`} className="activity-product-card">
            <div className="activity-product-img">
              <img src={p.image} alt={p.name} loading="lazy" />
            </div>
            <p className="activity-product-name">{p.name}</p>
            <p className="activity-product-price">{p.price.toFixed(2)} €</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Historial de búsquedas ──────────────────────────────────────────────────
function SearchHistory({ searches, onSearch }) {
  if (searches.length === 0) return null

  return (
    <div className="activity-section">
      <div className="activity-section-header">
        <Search size={16} />
        <h3>Búsquedas recientes</h3>
      </div>
      <div className="activity-searches">
        {searches.slice(0, 6).map((q, i) => (
          <button key={i} className="activity-search-pill" onClick={() => onSearch(q)}>
            <Search size={12} />
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
// variant: 'full' (StoreFront) | 'sidebar' (ProductDetail) | 'compact' (inline)
export default function RecentActivity({ variant = 'full', onSearch, excludeId }) {
  const { products } = useStore()
  const [viewed,   setViewed]   = useState([])
  const [carted,   setCarted]   = useState([])
  const [searches, setSearches] = useState([])
  const [hidden,   setHidden]   = useState(false)

  useEffect(() => {
    // Leer al montar y cuando cambia el foco (vuelven de otra pestaña)
    function refresh() {
      setViewed(activity.getViewed().filter(id => id !== excludeId))
      setCarted(activity.getCarted().filter(id => id !== excludeId))
      setSearches(activity.getSearches())
    }
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [excludeId])

  const hasAny = viewed.length > 0 || carted.length > 0 || searches.length > 0
  if (!hasAny || hidden) return null

  if (variant === 'sidebar') {
    // Solo muestra los vistos recientemente, compacto, en columna
    const items = activity.getAll()
      .filter(id => id !== excludeId)
      .map(id => products.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 5)

    if (items.length === 0) return null

    return (
      <div className="activity-sidebar">
        <h3 className="activity-sidebar-title"><Clock size={15}/>Vistos recientemente</h3>
        <div className="activity-sidebar-list">
          {items.map(p => (
            <Link key={p.id} to={`/producto/${p.id}`} className="activity-sidebar-item">
              <img src={p.image} alt={p.name} />
              <div>
                <p className="asb-name">{p.name}</p>
                <p className="asb-price">{p.price.toFixed(2)} €</p>
              </div>
              <ChevronRight size={14} className="asb-arrow" />
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // variant === 'full'
  return (
    <section className={`recent-activity recent-activity--${variant}`}>
      <div className="activity-header">
        <div className="activity-title">
          <Clock size={18} />
          <h2>Tu actividad reciente</h2>
        </div>
        <button className="activity-dismiss" onClick={() => setHidden(true)} title="Ocultar">
          <X size={16} />
        </button>
      </div>

      <ProductHistory
        ids={carted} products={products}
        title="Añadiste al carrito"
        icon={ShoppingBag}
      />
      <ProductHistory
        ids={viewed.filter(id => !carted.includes(id))} products={products}
        title="Productos vistos"
        icon={Clock}
      />
      <SearchHistory searches={searches} onSearch={onSearch} />

      <button className="activity-clear" onClick={() => {
        activity.clear()
        setViewed([]); setCarted([]); setSearches([])
      }}>
        Borrar historial
      </button>
    </section>
  )
}
