import React from 'react'
import { Bell, BellOff, CheckCircle } from 'lucide-react'
import { useStockAlert } from '../hooks/useStockAlert'
import './StockAlertForm.css'

export default function StockAlertForm({ productId, productName }) {
  const {
    email,
    setEmail,
    subscribed,
    loading,
    submitting,
    message,
    error,
    subscribe,
    unsubscribe,
  } = useStockAlert(productId)

  if (loading) return null

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
          <button type="button" className="stock-alert-cancel" onClick={unsubscribe} disabled={submitting}>
            <BellOff size={14}/> Cancelar aviso
          </button>
        </div>
      ) : (
        <form className="stock-alert-form" onSubmit={subscribe}>
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
