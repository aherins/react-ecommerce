import React, { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  checkStockAlert,
  subscribeStockAlert,
  unsubscribeStockAlert,
  getLocalAlertEmail,
} from '../lib/stockAlerts'
import './StockAlertForm.css'

export default function StockAlertForm({ productId, productName, compact = false }) {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email || getLocalAlertEmail(productId) || '')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const addr = user?.email || email || getLocalAlertEmail(productId)
      if (addr) {
        const active = await checkStockAlert(productId, addr)
        if (!cancelled) {
          setSubscribed(active)
          if (active) setEmail(addr)
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [productId, user?.email])

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user?.email])

  async function handleSubscribe(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    const result = await subscribeStockAlert({
      productId,
      email,
      userId: user?.id,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSubscribed(true)
    setMessage(result.already
      ? 'Ya tenías activada la alerta para este producto.'
      : '¡Listo! Te avisaremos cuando vuelva a haber stock.')
  }

  async function handleUnsubscribe() {
    setError('')
    setMessage('')
    setSubmitting(true)
    const result = await unsubscribeStockAlert({ productId, email })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSubscribed(false)
    setMessage('Has cancelado el aviso de stock.')
  }

  if (loading) {
    if (compact) {
      return <div className="stock-alert stock-alert--compact" aria-busy="true">
        <div className="stock-alert-inline-btn stock-alert-inline-btn--ghost">…</div>
      </div>
    }
    return null
  }

  if (compact) {
    return (
      <div className="stock-alert stock-alert--compact">
        {subscribed ? (
          <div className="stock-alert-inline-active" title={email}>
            <CheckCircle size={14} aria-hidden="true"/>
            <span className="stock-alert-inline-label">Aviso activo</span>
            <button
              type="button"
              className="stock-alert-inline-cancel"
              onClick={handleUnsubscribe}
              disabled={submitting}
              aria-label="Cancelar aviso de stock"
            >
              <BellOff size={13}/>
            </button>
          </div>
        ) : (
          <form className="stock-alert-inline-form" onSubmit={handleSubscribe}>
            {!user?.email && (
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="tu@email.com"
                required
                aria-label="Email para aviso de stock"
                className={error ? 'has-error' : ''}
              />
            )}
            <button
              type="submit"
              className="stock-alert-inline-btn"
              disabled={submitting}
              title={error || undefined}
              aria-label="Avisar cuando haya stock"
            >
              <Bell size={15} aria-hidden="true"/>
              <span>{submitting ? 'Guardando…' : 'Avisar cuando haya stock'}</span>
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="stock-alert">
      <div className="stock-alert-head">
        <Bell size={18}/>
        <div>
          <p className="stock-alert-title">Avisar cuando haya stock</p>
          {productName && (
            <p className="stock-alert-sub">Te escribiremos a tu email cuando «{productName}» esté disponible.</p>
          )}
        </div>
      </div>

      {subscribed ? (
        <div className="stock-alert-active">
          <CheckCircle size={16} color="var(--success)"/>
          <span>Te avisaremos en <strong>{email}</strong></span>
          <button type="button" className="stock-alert-cancel" onClick={handleUnsubscribe} disabled={submitting}>
            <BellOff size={14}/> Cancelar aviso
          </button>
        </div>
      ) : (
        <form className="stock-alert-form" onSubmit={handleSubscribe}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            aria-label="Email para aviso de stock"
          />
          <button type="submit" className="stock-alert-btn" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Activar aviso'}
          </button>
        </form>
      )}

      {message && <p className="stock-alert-msg stock-alert-msg--ok">{message}</p>}
      {error && <p className="stock-alert-msg stock-alert-msg--err">{error}</p>}
    </div>
  )
}
