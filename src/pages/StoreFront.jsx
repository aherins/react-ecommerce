import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecentActivity from '../components/RecentActivity'
import ProductCard from '../components/ProductCard'
import PageMeta from '../components/PageMeta'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { activity } from '../lib/activity'
import {
  getRootCategories,
  getChildCategories,
  resolveCategoryFilter,
  productMatchesCategoryFilter,
} from '../lib/categories'
import './StoreFront.css'

export default function StoreFront() {
  const { products, categories, loading, dbError } = useStore()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')

  function handleSearch(q) {
    setSearch(q)
    if (q.trim().length >= 2) activity.trackSearch(q.trim(), user?.id)
  }

  function applySearch(q) {
    setSearch(q)
    if (q) activity.trackSearch(q, user?.id)
  }

  const activeCat = params.get('cat') || ''
  const activeSub = params.get('sub') || ''
  const categoryFilter = resolveCategoryFilter(categories, activeCat, activeSub)
  const activeRoot = categoryFilter?.root
  const subcategories = activeRoot ? getChildCategories(categories, activeRoot.id) : []

  function setCategory(catSlug, subSlug = '') {
    if (!catSlug) {
      setParams({})
      return
    }
    if (subSlug) {
      setParams({ cat: catSlug, sub: subSlug })
      return
    }
    setParams({ cat: catSlug })
  }

  const filtered = products.filter(p => {
    if (!p.active) return false
    if (!productMatchesCategoryFilter(p.categoryId, categoryFilter)) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="storefront">
      <PageMeta/>
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-tag">Hecho a mano · Sevilla</span>
          <h1 className="hero-title">Objetos que<br/>cuentan algo</h1>
          <p className="hero-sub">Artesanía contemporánea para el hogar cotidiano</p>
        </div>
      </section>

      <main className="shop-main">
        {loading && (
          <div className="shop-status"><span className="spinner dark"/> Cargando catálogo…</div>
        )}
        {dbError && !loading && (
          <div className="shop-status error">No se pudo cargar el catálogo: {dbError}</div>
        )}

        <div className="shop-filters">
          <div className="filter-cats">
            <button
              type="button"
              className={`filter-btn ${!activeCat ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              Todos
            </button>
            {getRootCategories(categories).map(c => (
              <button
                key={c.id}
                type="button"
                className={`filter-btn ${activeCat === c.slug && !activeSub ? 'active' : ''} ${activeCat === c.slug && activeSub ? 'filter-btn--parent-active' : ''}`}
                onClick={() => setCategory(c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <input
            className="search-input"
            placeholder="Buscar…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {subcategories.length > 0 && activeCat && (
          <div className="filter-subs">
            <button
              type="button"
              className={`filter-btn filter-btn--sub ${activeCat && !activeSub ? 'active' : ''}`}
              onClick={() => setCategory(activeCat)}
            >
              Todos en {activeRoot.name}
            </button>
            {subcategories.map(sub => (
              <button
                key={sub.id}
                type="button"
                className={`filter-btn filter-btn--sub ${activeSub === sub.slug ? 'active' : ''}`}
                onClick={() => setCategory(activeCat, sub.slug)}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="shop-empty"><p>No hay productos que coincidan.</p></div>
        ) : (
          <div className="product-grid">
            {filtered.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard product={p}/>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="shop-activity-wrap">
        <RecentActivity variant="full" onSearch={applySearch}/>
      </div>
    </div>
  )
}
