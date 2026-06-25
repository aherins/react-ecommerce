import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
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
  const { user } = useAuth()
  const { orders, products, shippingCarriers } = useStore()
  const [filter, setFilter] = useState('all')

  const myOrders = useMemo(() => ordersForUser(orders, user), [orders, user])

  const filtered = useMemo(() => {
    if (filter === 'all') return myOrders
    return myOrders.filter(o => o.status === filter)
  }, [myOrders, filter])

  return (
    <>
      <div className="account-content-header">
        <h2>Mis pedidos</h2>
        <p>{myOrders.length} pedido{myOrders.length === 1 ? '' : 's'} en total</p>
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
            <OrderCard key={o.id} order={o} products={products} shippingCarriers={shippingCarriers}/>
          ))}
        </div>
      )}
    </>
  )
}
