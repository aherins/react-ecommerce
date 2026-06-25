import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, UserCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase, hasSupabase } from '../../lib/supabase'
import { fetchStoreCustomers } from '../../lib/customersApi'
import '../admin/AdminTable.css'
import './AdminCustomers.css'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminCustomers() {
  const { userCan } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => { loadCustomers(query) }, [query])

  async function loadCustomers(q) {
    setLoading(true)
    setError('')
    if (!hasSupabase) {
      setCustomers([])
      setError('Conecta Supabase para ver clientes registrados.')
      setLoading(false)
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sesión expirada.')
      const list = await fetchStoreCustomers(session.access_token, q)
      setCustomers(list)
    } catch (err) {
      setCustomers([])
      setError(err.message || 'No se pudieron cargar los clientes.')
    }
    setLoading(false)
  }

  function handleSearch(e) {
    e.preventDefault()
    setQuery(search.trim())
  }

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes de la tienda</h1>
          <p className="page-sub">
            {customers.length} registrados · actividad y pedidos de compradores (no equipo admin)
          </p>
        </div>
      </div>

      <form className="customers-search" onSubmit={handleSearch}>
        <Search size={16}/>
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-add">Buscar</button>
      </form>

      {error && <p className="customers-error">{error}</p>}

      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr>
            <th>Cliente</th>
            <th>Registro</th>
            <th>Última visita</th>
            <th>Pedidos</th>
            <th>Total gastado</th>
            <th></th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="table-loading">Cargando…</td></tr>}
            {!loading && customers.length === 0 && (
              <tr><td colSpan={6} className="table-empty">
                {hasSupabase ? 'Sin clientes registrados' : 'Modo demo sin clientes en BBDD'}
              </td></tr>
            )}
            {customers.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="customer-cell">
                    <div className="customer-avatar"><UserCircle size={18}/></div>
                    <div>
                      <span className="customer-name">{c.name || '—'}</span>
                      <span className="customer-email">{c.email}</span>
                    </div>
                  </div>
                </td>
                <td>{fmtDate(c.registered_at)}</td>
                <td>{fmtDate(c.last_seen_at)}</td>
                <td>{c.order_count}</td>
                <td>{c.total_spent.toFixed(2)} €</td>
                <td>
                  {userCan('clientes.ver') && (
                    <Link to={`/admin/clientes/${c.id}`} className="action-btn edit" title="Ver ficha">
                      <Eye size={14}/>
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
