import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ShoppingBag, Heart, Eye, Search, MessageSquare,
  Package, Send, ExternalLink, History, Tag, RotateCcw,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase, hasSupabase } from '../../lib/supabase'
import { fetchStoreCustomerDetail, addCustomerNote, resetCustomerPassword } from '../../lib/customersApi'
import { ORDER_STATUS_LABEL } from '../../lib/admin'
import { buildCustomerTimeline, getTimelineEventLabel, buildProductViewStats, mergeWishlistSources } from '../../lib/customerTimeline'
import './AdminCustomers.css'

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminCustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userCan } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('resumen')
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [info, setInfo] = useState('')

  const canNote = userCan('clientes.notas')
  const canResetPassword = userCan('usuarios.crear') || userCan('clientes.notas')

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    setError('')
    setInfo('')
    if (!hasSupabase) {
      setError('Conecta Supabase para ver fichas de cliente.')
      setLoading(false)
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sesión expirada.')
      setData(await fetchStoreCustomerDetail(session.access_token, id))
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!canNote || !note.trim()) return
    setSavingNote(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const created = await addCustomerNote(session.access_token, id, note.trim())
      setData(d => ({ ...d, notes: [created, ...(d.notes || [])] }))
      setNote('')
    } catch (err) {
      setError(err.message)
    }
    setSavingNote(false)
  }

  async function handleResetPassword() {
    if (!canResetPassword) return
    setResettingPassword(true)
    setError('')
    setInfo('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sesión expirada.')
      const result = await resetCustomerPassword(session.access_token, id)
      if (result.emailSent) {
        setInfo('Contraseña temporal enviada al cliente por email.')
      } else {
        setInfo(`Contraseña temporal generada (${result.tempPassword}). Email no enviado.`)
      }
    } catch (err) {
      setError(err.message)
    }
    setResettingPassword(false)
  }

  const timeline = useMemo(
    () => buildCustomerTimeline({
      orders: data?.orders ?? [],
      notes: data?.notes ?? [],
      events: data?.events ?? [],
    }),
    [data],
  )

  if (loading) return <div className="customer-detail-loading"><span className="spinner dark"/></div>
  if (error && !data) return (
    <div className="customer-detail-error">
      <p>{error}</p>
      <button onClick={() => navigate('/admin/clientes')}>Volver</button>
    </div>
  )
  if (!data) return null

  const { customer, stats, orders, events, wishlist: wishlistRaw, notes, product_views: productViewsRaw } = data
  const wishlistFromEvents = mergeWishlistSources(
    [],
    events.filter(e => e.event_type === 'wishlist_add' || e.event_type === 'wishlist_remove'),
  )
  const wishlist = (wishlistRaw?.length ? wishlistRaw : wishlistFromEvents)
  const productViews = productViewsRaw ?? buildProductViewStats(
    events.filter(e => e.event_type === 'product_view'),
    Object.fromEntries(
      events.filter(e => e.product_id && e.product).map(e => [e.product_id, e.product]),
    ),
  )
  const viewsTotal = stats.views_total ?? stats.views_count ?? productViews.reduce((s, v) => s + v.count, 0)
  const viewsUnique = stats.views_unique ?? productViews.length
  const wishlistCount = stats.wishlist_count ?? wishlist.length
  const tabs = [
    { key: 'resumen', label: 'Resumen', icon: Package },
    { key: 'historial', label: 'Historial', icon: History },
    { key: 'pedidos', label: `Pedidos (${orders.length})`, icon: ShoppingBag },
    { key: 'actividad', label: 'Actividad', icon: Eye },
    { key: 'deseos', label: `Deseos (${wishlistCount})`, icon: Heart },
    { key: 'notas', label: `Notas (${notes.length})`, icon: MessageSquare },
  ]

  return (
    <div className="customer-detail-page">
      <Link to="/admin/clientes" className="customer-back"><ArrowLeft size={16}/> Clientes</Link>

      <header className="customer-detail-header">
        <div className="customer-detail-avatar">
          {customer.avatar_url
            ? <img src={customer.avatar_url} alt="" referrerPolicy="no-referrer"/>
            : <span>{(customer.name || customer.email)[0].toUpperCase()}</span>}
        </div>
        <div>
          <h1 className="customer-detail-title">
            {customer.name || customer.email}
            {customer.is_active_team && (
              <span className="customer-badge customer-badge--team">
                Equipo{customer.team_role_label ? ` · ${customer.team_role_label}` : ''}
              </span>
            )}
            {customer.is_former_team && (
              <span className="customer-badge customer-badge--former">Ex-equipo</span>
            )}
          </h1>
          <p>{customer.email}</p>
          <div className="customer-detail-meta">
            <span>Registro: {fmtDateTime(customer.registered_at)}</span>
            <span>Última visita: {fmtDateTime(customer.last_seen_at)}</span>
          </div>
        </div>
        {canResetPassword && !customer.is_active_team && (
          <button
            type="button"
            className="customer-reset-pass-btn"
            onClick={handleResetPassword}
            disabled={resettingPassword}
          >
            <RotateCcw size={14}/>
            {resettingPassword ? 'Reseteando…' : 'Resetear contraseña'}
          </button>
        )}
      </header>
      {info && <p className="customers-info">{info}</p>}
      {error && data && <p className="customers-error">{error}</p>}

      <div className="customer-stats-row">
        <div className="customer-stat"><strong>{stats.order_count}</strong><span>Pedidos</span></div>
        <div className="customer-stat"><strong>{stats.total_spent.toFixed(2)} €</strong><span>Gastado</span></div>
        <div className="customer-stat customer-stat--views">
          <strong>{viewsTotal} visitas · {viewsUnique} productos</strong>
          <span>Vistas de ficha</span>
        </div>
        <div className="customer-stat"><strong>{wishlistCount}</strong><span>En deseos</span></div>
      </div>

      <nav className="customer-tabs">
        {tabs.map(t => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            <t.icon size={14}/> {t.label}
          </button>
        ))}
      </nav>

      <div className="customer-tab-panel">
        {tab === 'resumen' && (
          <div className="customer-summary">
            <p>Cliente registrado en la tienda online. Usa las pestañas para ver pedidos, navegación y notas internas.</p>
            {orders[0] && (
              <div className="customer-last-order">
                <h3>Último pedido</h3>
                <p>#{orders[0].id.slice(-8).toUpperCase()} · {ORDER_STATUS_LABEL[orders[0].status] || orders[0].status} · {Number(orders[0].total).toFixed(2)} €</p>
                <Link to="/admin/pedidos" state={{ openOrderId: orders[0].id }}>Ver en pedidos <ExternalLink size={12}/></Link>
              </div>
            )}
          </div>
        )}

        {tab === 'historial' && (
          <ul className="customer-history">
            {timeline.length === 0 && (
              <li className="muted">Sin actividad registrada todavía.</li>
            )}
            {timeline.map(item => (
              <li key={item.id} className={`customer-history-item customer-history-item--${item.type}`}>
                <span className="customer-history-time">{fmtDateTime(item.at)}</span>
                <div className="customer-history-body">
                  {item.type === 'order' && (
                    <>
                      <span className="customer-history-type">
                        <ShoppingBag size={14}/> Pedido #{item.order.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="customer-history-detail">
                        {ORDER_STATUS_LABEL[item.order.status] || item.order.status}
                        {' · '}{Number(item.order.total).toFixed(2)} €
                        {item.order.coupon_code && (
                          <span className="customer-history-coupon">
                            <Tag size={12}/> {item.order.coupon_code}
                            {Number(item.order.discount) > 0 && ` (−${Number(item.order.discount).toFixed(2)} €)`}
                          </span>
                        )}
                      </span>
                      <Link to="/admin/pedidos" state={{ openOrderId: item.order.id }} className="customer-history-link">
                        Ver pedido <ExternalLink size={11}/>
                      </Link>
                    </>
                  )}
                  {item.type === 'note' && (
                    <>
                      <span className="customer-history-type">
                        <MessageSquare size={14}/> Nota interna
                      </span>
                      <p className="customer-history-note">{item.note.body}</p>
                      <span className="customer-history-meta">{item.note.author_name}</span>
                    </>
                  )}
                  {item.type === 'event' && (
                    <>
                      <span className="customer-history-type">
                        <Eye size={14}/> {getTimelineEventLabel(item.event)}
                      </span>
                      {item.event.product && (
                        <span className="customer-history-detail">{item.event.product.name}</span>
                      )}
                      {item.event.event_type === 'search' && item.event.metadata?.query && (
                        <span className="customer-history-detail">
                          <Search size={12}/> «{item.event.metadata.query}»
                        </span>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === 'pedidos' && (
          <div className="customer-orders-list">
            {orders.length === 0 && <p className="muted">Sin pedidos</p>}
            {orders.map(o => (
              <div key={o.id} className="customer-order-row">
                <div>
                  <strong>#{o.id.slice(-8).toUpperCase()}</strong>
                  <span>{fmtDateTime(o.created_at)}</span>
                </div>
                <span>{ORDER_STATUS_LABEL[o.status] || o.status}</span>
                <strong>{Number(o.total).toFixed(2)} €</strong>
                <Link to="/admin/pedidos" state={{ openOrderId: o.id }}>Abrir</Link>
              </div>
            ))}
          </div>
        )}

        {tab === 'actividad' && (
          <div className="customer-activity-panel">
            {productViews.length > 0 && (
              <section className="customer-product-views">
                <h3>Productos vistos</h3>
                <p className="customer-product-views-summary muted">
                  {viewsTotal} visitas a ficha · {viewsUnique} producto{viewsUnique !== 1 ? 's' : ''} distinto{viewsUnique !== 1 ? 's' : ''}
                </p>
                <ul className="customer-product-views-list">
                  {productViews.map(v => (
                    <li key={v.product_id} className="customer-product-view-row">
                      {v.product?.image ? (
                        <img src={v.product.image} alt="" className="customer-product-view-thumb"/>
                      ) : (
                        <div className="customer-product-view-thumb customer-product-view-thumb--empty"/>
                      )}
                      <div className="customer-product-view-info">
                        <strong>{v.product?.name || v.product_id}</strong>
                        {v.product?.price != null && (
                          <span>{Number(v.product.price).toFixed(2)} €</span>
                        )}
                        <small>Última visita: {fmtDateTime(v.last_viewed_at)}</small>
                      </div>
                      <div className="customer-product-view-count">
                        <strong>{v.count}</strong>
                        <span>{v.count === 1 ? 'visita' : 'visitas'}</span>
                      </div>
                      {v.product && (
                        <Link to={`/producto/${v.product_id}`} className="customer-product-view-link" target="_blank" rel="noreferrer">
                          Ver <ExternalLink size={11}/>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="customer-activity-log">
              <h3>Registro de actividad</h3>
              <ul className="customer-timeline">
                {events.length === 0 && <li className="muted">Sin actividad registrada (solo se guarda con sesión iniciada)</li>}
                {events.map(e => (
                  <li key={e.id}>
                    <span className="timeline-time">{fmtDateTime(e.created_at)}</span>
                    <span className="timeline-type">{getTimelineEventLabel(e)}</span>
                    {e.product && <span className="timeline-product">{e.product.name}</span>}
                    {e.event_type === 'search' && e.metadata?.query && (
                      <span className="timeline-product"><Search size={12}/> «{e.metadata.query}»</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {tab === 'deseos' && (
          <div className="customer-wishlist-grid">
            {wishlist.length === 0 && <p className="muted">Lista de deseos vacía</p>}
            {wishlist.map(w => {
              const productId = w.product_id || w.product?.id
              if (!productId) return null
              const productUrl = `/producto/${productId}`
              return (
                <article key={productId} className="customer-wish-card">
                  <Link to={productUrl} className="customer-wish-card-media" target="_blank" rel="noreferrer">
                    {w.product?.image ? (
                      <img src={w.product.image} alt={w.product.name || ''}/>
                    ) : (
                      <div className="customer-wish-card-media-fallback"/>
                    )}
                  </Link>
                  <div className="customer-wish-card-body">
                    <Link to={productUrl} className="customer-wish-card-title" target="_blank" rel="noreferrer">
                      {w.product?.name || productId}
                    </Link>
                    {w.product?.price != null && (
                      <span>{Number(w.product.price).toFixed(2)} €</span>
                    )}
                    <small>Añadido: {fmtDateTime(w.added_at)}</small>
                    <Link to={productUrl} className="customer-wish-card-link" target="_blank" rel="noreferrer">
                      Ver en tienda <ExternalLink size={11}/>
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {tab === 'notas' && (
          <div className="customer-notes">
            {canNote && (
              <form className="customer-note-form" onSubmit={handleAddNote}>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Nota interna sobre este cliente (solo visible para el equipo)…"
                  rows={3}
                />
                <button type="submit" disabled={savingNote || !note.trim()}>
                  {savingNote ? <span className="spinner"/> : <><Send size={14}/> Guardar nota</>}
                </button>
              </form>
            )}
            <ul className="customer-notes-list">
              {notes.length === 0 && <li className="muted">Sin notas</li>}
              {notes.map(n => (
                <li key={n.id}>
                  <p>{n.body}</p>
                  <small>{n.author_name} · {fmtDateTime(n.created_at)}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
