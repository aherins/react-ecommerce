import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle, Zap, Truck } from 'lucide-react'
import CouponInput from '../components/CouponInput'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { validateCartStock } from '../context/store/stock'
import { stripePromise, hasStripe, checkStripeBackend, MOCK_CARDS, simulatePayment } from '../lib/stripe'
import './CheckoutPage.css'

// ─── Resumen lateral ──────────────────────────────────────────────────────────
function OrderSummary({ items, cartTotal, applied, onApply, onRemove }) {
  const discount   = applied?.discount   || 0
  const finalTotal = applied?.finalTotal ?? cartTotal
  return (
    <div className="checkout-summary">
      <h3>Resumen del pedido</h3>
      <div className="summary-items">
        {items.map(({ product, qty, productId }) => (
          <div key={productId} className="summary-item">
            <img src={product.image} alt={product.name}/>
            <div><p>{product.name}</p><p className="summary-item-qty">× {qty}</p></div>
            <span>{(product.price * qty).toFixed(2)} €</span>
          </div>
        ))}
      </div>
      <div className="summary-divider"/>
      <div className="summary-coupon">
        <CouponInput applied={applied} onApply={onApply} onRemove={onRemove}/>
      </div>
      <div className="summary-row"><span>Subtotal</span><span>{cartTotal.toFixed(2)} €</span></div>
      {discount > 0 && (
        <div className="summary-row" style={{color:'var(--success)',fontWeight:600}}>
          <span>Descuento</span><span>−{discount.toFixed(2)} €</span>
        </div>
      )}
      <div className="summary-row">
        <span>Envío</span>
        <span>{applied?.freeShip ? <span style={{color:'var(--success)'}}>Gratis 🎉</span> : 'Gratis'}</span>
      </div>
      <div className="summary-total"><span>Total</span><span>{finalTotal.toFixed(2)} €</span></div>
    </div>
  )
}

// ─── Pantalla de éxito ────────────────────────────────────────────────────────
function SuccessScreen({ paymentId, simulated }) {
  return (
    <div className="checkout-success">
      <CheckCircle size={52} color="var(--success)"/>
      <h2>¡Pago confirmado!</h2>
      <p>Gracias por tu compra. Recibirás un email de confirmación en breve.</p>
      {paymentId && (
        <p className="payment-ref">
          Ref: <code>{paymentId}</code>
          {simulated && <span className="sim-tag">simulado</span>}
        </p>
      )}
      <Link to="/" className="btn-primary">Seguir comprando</Link>
    </div>
  )
}

// ─── Formulario simulación ────────────────────────────────────────────────────
function SimulationForm({ items, finalTotal, applied, onApply, onRemove, onSuccess, cart, products }) {
  const { dispatch } = useStore()
  const [card,    setCard]    = useState(MOCK_CARDS[0].number)
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handlePay() {
    if (!name.trim()) { setError('Introduce el nombre del titular.'); return }
    const stockError = validateCartStock(cart, products)
    if (stockError) { setError(stockError); return }
    setError(''); setLoading(true)
    try {
      const result = await simulatePayment({ card })
      dispatch({ type: 'CART_CLEAR' })
      onSuccess({ id: result.id, simulated: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="checkout-form-wrap">
      <div className="sim-banner"><Zap size={14}/><span>Modo simulación — sin credenciales Stripe reales.</span></div>
      <div className="checkout-grid">
        <div className="checkout-form">
          <h2>Datos de pago</h2>
          <div className="form-row"><label>Titular</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre Apellido"/></div>
          <div className="form-row"><label>Tarjeta de prueba</label>
            <div className="mock-cards">
              {MOCK_CARDS.map(c => (
                <label key={c.number} className={`mock-card-option ${card===c.number?'selected':''}`}>
                  <input type="radio" name="mc" value={c.number} checked={card===c.number} onChange={()=>setCard(c.number)}/>
                  <div><code>{c.number}</code><span className={`mock-label ${c.result}`}>{c.label}</span></div>
                </label>
              ))}
            </div>
          </div>
          {error && <div className="checkout-error"><AlertCircle size={16}/>{error}</div>}
          <button className="pay-btn" onClick={handlePay} disabled={loading}>
            {loading ? <><span className="spinner"/>Procesando…</> : <><Lock size={16}/>Pagar {finalTotal.toFixed(2)} €</>}
          </button>
          <p className="pay-note"><Zap size={12}/> Pago simulado — no se cargará nada</p>
        </div>
        <OrderSummary items={items} cartTotal={items.reduce((s,i)=>s+i.product.price*i.qty,0)}
          applied={applied} onApply={onApply} onRemove={onRemove}/>
      </div>
    </div>
  )
}

// ─── Formulario Stripe real ───────────────────────────────────────────────────
function RealStripeForm({ items, finalTotal, applied, onApply, onRemove, onSuccess, cart, products }) {
  const stripe   = useStripe()
  const elements = useElements()
  const { dispatch } = useStore()
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handlePay() {
    if (!stripe || !elements) return
    if (!name.trim()) { setError('Introduce el nombre del titular.'); return }
    const stockError = validateCartStock(cart, products)
    if (stockError) { setError(stockError); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(finalTotal * 100), currency: 'eur' }),
      })
      const { clientSecret, error: se } = await res.json()
      if (se) throw new Error(se)
      const { error: se2, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { name } },
      })
      if (se2) throw new Error(se2.message)
      dispatch({ type: 'CART_CLEAR' })
      onSuccess({ id: paymentIntent.id, simulated: false })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="checkout-form-wrap">
      <div className="checkout-grid">
        <div className="checkout-form">
          <h2>Datos de pago</h2>
          <div className="form-row"><label>Titular</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre Apellido"/></div>
          <div className="form-row"><label>Tarjeta</label>
            <div className="stripe-card-wrap"><CardElement options={{style:{base:{fontFamily:'"DM Sans",sans-serif',fontSize:'15px',color:'#0f0e0d','::placeholder':{color:'#8a8680'}}}}}/></div>
          </div>
          {error && <div className="checkout-error"><AlertCircle size={16}/>{error}</div>}
          <button className="pay-btn" onClick={handlePay} disabled={loading || !stripe}>
            {loading ? <><span className="spinner"/>Procesando…</> : <><Lock size={16}/>Pagar {finalTotal.toFixed(2)} €</>}
          </button>
          <p className="pay-note"><Lock size={12}/> Pago seguro con Stripe</p>
        </div>
        <OrderSummary items={items} cartTotal={items.reduce((s,i)=>s+i.product.price*i.qty,0)}
          applied={applied} onApply={onApply} onRemove={onRemove}/>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { cart, products, cartTotal, dispatch } = useStore()
  const { user } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [result,   setResult]  = useState(null)
  const [applied,  setApplied] = useState(location.state?.applied || null)
  const [useSimulation, setUseSimulation] = useState(!hasStripe)
  const [checkingStripe, setCheckingStripe] = useState(hasStripe)

  useEffect(() => {
    if (!hasStripe) return
    let cancelled = false
    checkStripeBackend().then(ok => {
      if (!cancelled) {
        setUseSimulation(!ok)
        setCheckingStripe(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const items      = (cart||[]).map(i=>({...i,product:(products||[]).find(p=>p.id===i.productId)})).filter(i=>i.product)
  const discount   = applied?.discount   || 0
  const finalTotal = applied?.finalTotal ?? cartTotal

  function handleSuccess(payment) {
    const order = {
      id: payment.id, paymentId: payment.id,
      userId: user?.id || null,
      email: user?.email || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      total: finalTotal, subtotal: cartTotal, discount,
      couponCode: applied?.coupon?.code || null,
      items: (cart||[]).map(i => ({ productId: i.productId, qty: i.qty })),
      simulated: Boolean(payment.simulated),
    }
    dispatch({ type: 'ADD_ORDER', order })
    // Incrementar uso del cupón
    if (applied?.coupon) dispatch({ type: 'COUPON_USE', id: applied.coupon.id })
    setResult(payment)
  }

  if (result) return <SuccessScreen paymentId={result.id} simulated={result.simulated}/>

  if (items.length === 0) return (
    <div className="checkout-empty"><p>El carrito está vacío.</p><Link to="/" className="btn-primary">Ver productos</Link></div>
  )

  const formProps = {
    items, finalTotal, applied,
    onApply: setApplied,
    onRemove: () => setApplied(null),
    onSuccess: handleSuccess,
    cart,
    products,
  }

  return (
    <main className="checkout-main">
      <div className="checkout-inner">
          <Link to="/carrito" className="checkout-back"><ArrowLeft size={16}/> Volver al carrito</Link>
          <h1 className="checkout-title">
            <CreditCard size={22}/>Pago
            {useSimulation && <span className="sim-pill"><Zap size={12}/>Simulación</span>}
          </h1>
          {checkingStripe ? (
            <div className="checkout-loading"><span className="spinner"/>Preparando pago…</div>
          ) : useSimulation
            ? <SimulationForm {...formProps}/>
            : <Elements stripe={stripePromise}><RealStripeForm {...formProps}/></Elements>
          }
        </div>
    </main>
  )
}
