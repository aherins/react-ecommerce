import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'
import './StoreFront.css'

export default function StoreFront() {
  const { products, categories } = useStore()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
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
      <Navbar />

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
            onChange={e => setSearch(e.target.value)}
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

      <footer className="footer">
        <p>© {new Date().getFullYear()} Artesana · <a href="/admin">Admin</a></p>
      </footer>
    </div>
  )
}
