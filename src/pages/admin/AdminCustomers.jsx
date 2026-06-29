import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, UserCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase, hasSupabase } from '../../lib/supabase'
import { fetchStoreCustomers } from '../../lib/customersApi'
import { ROLE_LABELS } from '../../lib/roles'
import '../admin/AdminTable.css'
import './AdminCustomers.css'

const SEGMENTS = [
  { key: 'all', label: 'Todos' },
  { key: 'store', label: 'Solo clientes' },
  { key: 'team', label: 'Equipo' },
]

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CustomerBadges({ customer }) {
  if (customer.is_active_team) {
    return (
      <span className="customer-badge customer-badge--team" title="Miembro del equipo con actividad en tienda">
        Equipo{customer.team_role ? ` · ${ROLE_LABELS[customer.team_role] || customer.team_role}` : ''}
      </span>
    )
  }
  if (customer.is_former_team) {
    return (
      <span className="customer-badge customer-badge--former" title="Ex miembro del equipo">
        Ex-equipo
      </span>
    )
  }
  return null
}

export default function AdminCustomers() {
  const { userCan } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState('all')

  useEffect(() => { loadCustomers(query, segment) }, [query, segment])

  async function loadCustomers(q, seg) {
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
      const list = await fetchStoreCustomers(session.access_token, q, seg)
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

  const teamCount = customers.filter(c => c.is_active_team || c.is_former_team).length

  return (
    <div className="admin-table-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes de la tienda</h1>
          <p className="page-sub">
            {customers.length} en listado
            {segment === 'all' && teamCount > 0 && ` · ${teamCount} del equipo`}
            {' · '}compradores y cuentas con actividad en la tienda
          </p>
        </div>
      </div>

      <div className="customers-segments">
        {SEGMENTS.map(s => (
          <button
            key={s.key}
            type="button"
            className={segment === s.key ? 'active' : ''}
            onClick={() => setSegment(s.key)}
          >
            {s.label}
          </button>
        ))}
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
                {hasSupabase ? 'Sin resultados para este filtro' : 'Modo demo sin clientes en BBDD'}
              </td></tr>
            )}
            {customers.map(c => (
              <tr key={c.id} className={c.is_active_team || c.is_former_team ? 'customer-row--team' : ''}>
                <td>
                  <div className="customer-cell">
                    <div className="customer-avatar"><UserCircle size={18}/></div>
                    <div>
                      <span className="customer-name-row">
                        <span className="customer-name">{c.name || '—'}</span>
                        <CustomerBadges customer={c}/>
                      </span>
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
