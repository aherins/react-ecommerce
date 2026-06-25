import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import RecentActivity from '../components/RecentActivity'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { activity } from '../lib/activity'
import './StoreFront.css'

export default function StoreFront() {
  const { products, categories } = useStore()
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

  const filtered = products.filter(p => {
    if (!p.active) return false
    const cat = categories.find(c => c.id === p.categoryId)
    if (activeCat && cat?.slug !== activeCat) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="storefront">
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-tag">Hecho a mano · Sevilla</span>
          <h1 className="hero-title">Objetos que<br />cuentan algo</h1>
          <p className="hero-sub">Artesanía contemporánea para el hogar cotidiano</p>
        </div>
      </section>

      <main className="shop-main">
        <div className="shop-filters">
          <div className="filter-cats">
            <button
              className={`filter-btn ${!activeCat ? 'active' : ''}`}
              onClick={() => setParams({})}
            >Todos</button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`filter-btn ${activeCat === c.slug ? 'active' : ''}`}
                onClick={() => setParams({ cat: c.slug })}
              >{c.name}</button>
            ))}
          </div>
          <input
            className="search-input"
            placeholder="Buscar…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="shop-empty">
            <p>No hay productos que coincidan.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map((p, i) => (
              <div key={p.id} style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="shop-activity-wrap">
        <RecentActivity variant="full" onSearch={applySearch} />
      </div>
    </div>
  )
}
