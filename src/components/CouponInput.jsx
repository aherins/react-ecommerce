import React, { useState } from 'react'
import { Tag, X, CheckCircle, AlertCircle, Truck } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { validateCoupon } from '../lib/coupons'
import './CouponInput.css'

export default function CouponInput({ applied, onApply, onRemove }) {
  const { coupons, cart, products } = useStore()
  const { user } = useAuth()
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function handleApply() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setError(''); setLoading(true)
    setTimeout(() => {
      const coupon = coupons.find(c => c.code.toUpperCase() === trimmed)
      const result = validateCoupon({ coupon, cart, products, userEmail: user?.email || null })
      if (!result.valid) { setError(result.error); setLoading(false); return }
      onApply({ coupon, discount: result.discount, finalTotal: result.finalTotal, freeShip: result.freeShip })
      setCode(''); setLoading(false)
    }, 350)
  }

  if (applied) {
    return (
      <div className="ci-applied">
        <div className="ci-applied-left">
          {applied.freeShip
            ? <Truck size={15} color="var(--success)"/>
            : <CheckCircle size={15} color="var(--success)"/>}
          <div>
            <span className="ci-applied-code">{applied.coupon.code}</span>
            <span className="ci-applied-desc">{applied.coupon.description}</span>
          </div>
        </div>
        <div className="ci-applied-right">
          <span className="ci-applied-amount">
            {applied.freeShip ? 'Envío gratis' : `-${applied.discount.toFixed(2)} €`}
          </span>
          <button className="ci-remove" onClick={onRemove}><X size={14}/></button>
        </div>
      </div>
    )
  }

  return (
    <div className="ci-wrap">
      <div className="ci-row">
        <div className={`ci-input-wrap ${error ? 'has-error' : ''}`}>
          <Tag size={14} className="ci-icon"/>
          <input
            className="ci-input"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Código de descuento"
            autoComplete="off" spellCheck={false}
          />
          {code && <button className="ci-clear" onClick={() => { setCode(''); setError('') }}><X size={13}/></button>}
        </div>
        <button className="ci-btn" onClick={handleApply} disabled={!code.trim() || loading}>
          {loading ? <span className="ci-spin"/> : 'Aplicar'}
        </button>
      </div>
      {error && <p className="ci-error"><AlertCircle size={13}/>{error}</p>}
    </div>
  )
}
