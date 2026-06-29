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
  parseCategoryPath,
  productMatchesCategoryFilter,
  getPathToCategory,
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

  const pathParam = params.get('path') || ''
  const legacyCat = params.get('cat') || ''
  const legacySub = params.get('sub') || ''
  const categoryFilter = parseCategoryPath(categories, pathParam, legacyCat, legacySub)
  const activeCategory = categoryFilter?.active
  const pathSegments = categoryFilter?.segments || []
  const activeRoot = pathSegments[0] || null
  const effectivePath = pathParam || (legacySub ? `${legacyCat}/${legacySub}` : legacyCat)
  const currentPath = activeCategory ? getPathToCategory(categories, activeCategory.id) : ''
  const childCategories = activeCategory
    ? getChildCategories(categories, activeCategory.id)
    : []

  function setPath(pathStr) {
    if (!pathStr) {
      setParams({})
      return
    }
    setParams({ path: pathStr })
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
              className={`filter-btn ${!activeCategory ? 'active' : ''}`}
              onClick={() => setPath('')}
            >
              Todos
            </button>
            {getRootCategories(categories).map(c => {
              const isOnBranch = activeRoot?.id === c.id
              const isExact = isOnBranch && pathSegments.length === 1
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`filter-btn ${isExact ? 'active' : ''} ${isOnBranch && pathSegments.length > 1 ? 'filter-btn--parent-active' : ''}`}
                  onClick={() => setPath(c.slug)}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
          <input
            className="search-input"
            placeholder="Buscar…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {pathSegments.length > 1 && (
          <nav className="filter-breadcrumb" aria-label="Ruta de categoría">
            {pathSegments.map((seg, i) => {
              const partialPath = pathSegments.slice(0, i + 1).map(s => s.slug).join('/')
              const isLast = i === pathSegments.length - 1
              return (
                <React.Fragment key={seg.id}>
                  {i > 0 && <span className="filter-breadcrumb-sep">›</span>}
                  <button
                    type="button"
                    className={`filter-breadcrumb-btn ${isLast ? 'active' : ''}`}
                    onClick={() => setPath(partialPath)}
                  >
                    {seg.name}
                  </button>
                </React.Fragment>
              )
            })}
          </nav>
        )}

        {childCategories.length > 0 && activeCategory && (
          <div className="filter-subs">
            <button
              type="button"
              className="filter-btn filter-btn--sub active"
              onClick={() => setPath(currentPath)}
            >
              Todos en {activeCategory.name}
            </button>
            {childCategories.map(sub => {
              const subPath = getPathToCategory(categories, sub.id)
              const isSubActive = effectivePath === subPath || effectivePath.startsWith(`${subPath}/`)
              return (
                <button
                  key={sub.id}
                  type="button"
                  className={`filter-btn filter-btn--sub ${isSubActive ? 'active' : ''}`}
                  onClick={() => setPath(subPath)}
                >
                  {sub.name}
                </button>
              )
            })}
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
