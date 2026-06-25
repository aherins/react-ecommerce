import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, User, LogOut, ShoppingBag } from 'lucide-react'
import Navbar from '../components/Navbar'
import OrderCard from '../components/OrderCard'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { ordersForUser } from '../lib/orders'
import './MyOrdersPage.css'

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'processing', label: 'En preparación' },
  { key: 'shipped', label: 'En camino' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
]

export default function MyOrdersPage() {
  const { user, signOut } = useAuth()
  const { orders, products } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) navigate('/cuenta', { replace: true })
  }, [user, navigate])

  const myOrders = useMemo(() => ordersForUser(orders, user), [orders, user])

  const filtered = useMemo(() => {
    if (filter === 'all') return myOrders
    return myOrders.filter(o => o.status === filter)
  }, [myOrders, filter])

  if (!user) return null

  const name   = user.user_metadata?.full_name || user.email || 'Usuario'
  const avatar = user.user_metadata?.avatar_url

  return (
    <div>
      <Navbar />
      <main className="my-orders-main">
        <div className="my-orders-inner">
          <Link to="/cuenta" className="my-orders-back">
            <ArrowLeft size={16}/> Mi cuenta
          </Link>

          <div className="my-orders-layout">
            <aside className="my-orders-sidebar">
              <div className="my-orders-profile">
                {avatar
                  ? <img src={avatar} alt={name} className="my-orders-avatar" referrerPolicy="no-referrer"/>
                  : <div className="my-orders-avatar-placeholder"><User size={24}/></div>}
                <div>
                  <h1>{name}</h1>
                  <p>{user.email}</p>
                </div>
              </div>

              <nav className="my-orders-nav">
                <span className="my-orders-nav-item active"><Package size={16}/> Mis pedidos</span>
                <Link to="/deseos" className="my-orders-nav-item"><ShoppingBag size={16}/> Lista de deseos</Link>
                <Link to="/cuenta" className="my-orders-nav-item"><User size={16}/> Cuenta</Link>
              </nav>

              <button className="my-orders-signout" onClick={signOut}>
                <LogOut size={16}/> Cerrar sesión
              </button>
            </aside>

            <section className="my-orders-content">
              <div className="my-orders-header">
                <div>
                  <h2>Mis pedidos</h2>
                  <p>{myOrders.length} pedido{myOrders.length === 1 ? '' : 's'} en total</p>
                </div>
              </div>

              {myOrders.length > 0 && (
                <div className="my-orders-filters">
                  {FILTERS.map(f => {
                    const count = f.key === 'all'
                      ? myOrders.length
                      : myOrders.filter(o => o.status === f.key).length
                    if (f.key !== 'all' && count === 0) return null
                    return (
                      <button
                        key={f.key}
                        className={`my-orders-filter ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                      >
                        {f.label} <span>{count}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {filtered.length === 0 ? (
                <div className="my-orders-empty">
                  <Package size={40} color="var(--border)"/>
                  <h3>{myOrders.length === 0 ? 'Aún no tienes pedidos' : 'No hay pedidos con ese estado'}</h3>
                  <p>
                    {myOrders.length === 0
                      ? 'Cuando compres estando conectado, tus pedidos aparecerán aquí.'
                      : 'Prueba con otro filtro para ver más pedidos.'}
                  </p>
                  {myOrders.length === 0 && (
                    <Link to="/" className="btn-primary">Ir a la tienda</Link>
                  )}
                </div>
              ) : (
                <div className="my-orders-list">
                  {filtered.map(o => (
                    <OrderCard key={o.id} order={o} products={products}/>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
