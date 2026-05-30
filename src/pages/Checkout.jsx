import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useStore } from '../context/StoreContext'
import { stripePromise, hasStripe, MOCK_CARDS, simulatePayment } from '../lib/stripe'
import './CheckoutPage.css'

// ─── Shared order summary ─────────────────────────────────────────────────────
function OrderSummary({ items, cartTotal }) {
  return (
    <div className="checkout-summary">
      <h3>Resumen del pedido</h3>
      <div className="summary-items">
        {items.map(({ product, qty, productId }) => (
          <div key={productId} className="summary-item">
            <img src={product.image} alt={product.name} />
            <div>
              <p>{product.name}</p>
              <p className="summary-item-qty">× {qty}</p>
            </div>
            <span>{(product.price * qty).toFixed(2)} €</span>
          </div>
        ))}
      </div>
      <div className="summary-divider" />
      <div className="summary-row"><span>Subtotal</span><span>{cartTotal.toFixed(2)} €</span></div>
      <div className="summary-row"><span>Envío</span><span>Gratis</span></div>
      <div className="summary-total"><span>Total</span><span>{cartTotal.toFixed(2)} €</span></div>
    </div>
  )
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
function SuccessScreen({ paymentId, simulated }) {
  return (
    <div className="checkout-success">
      <CheckCircle size={52} color="var(--success)" />
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

// ─── SIMULATION FORM ──────────────────────────────────────────────────────────
function SimulationForm({ items, cartTotal, onSuccess }) {
  const { dispatch } = useStore()
  const [card,    setCard]    = useState(MOCK_CARDS[0].number)
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handlePay() {
    if (!name.trim()) { setError('Introduce el nombre del titular.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await simulatePayment({ card })
      dispatch({ type: 'CART_CLEAR' })
      onSuccess({ id: result.id, simulated: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout-form-wrap">
      <div className="sim-banner">
        <Zap size={14} />
        <span>Modo simulación — sin credenciales Stripe reales. Elige un escenario de prueba.</span>
      </div>

      <div className="checkout-grid">
        <div className="checkout-form">
          <h2>Datos de pago</h2>

          <div className="form-row">
            <label>Titular de la tarjeta</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre Apellido"
            />
          </div>

          <div className="form-row">
            <label>Tarjeta de prueba</label>
            <div className="mock-cards">
              {MOCK_CARDS.map(c => (
                <label key={c.number} className={`mock-card-option ${card === c.number ? 'selected' : ''}`}>
                  <input
                    type="radio" name="mockcard" value={c.number}
                    checked={card === c.number}
                    onChange={() => setCard(c.number)}
                  />
                  <div>
                    <code>{c.number}</code>
                    <span className={`mock-label ${c.result}`}>{c.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-row sim-extra">
            <label>Expiración</label>
            <input value="12/26" readOnly />
            <label>CVC</label>
            <input value="123" readOnly />
          </div>

          {error && (
            <div className="checkout-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button className="pay-btn" onClick={handlePay} disabled={loading}>
            {loading
              ? <><span className="spinner" />Procesando…</>
              : <><Lock size={16} />Pagar {cartTotal.toFixed(2)} €</>
            }
          </button>
          <p className="pay-note"><Zap size={12} /> Pago simulado — no se cargará nada</p>
        </div>

        <OrderSummary items={items} cartTotal={cartTotal} />
      </div>
    </div>
  )
}

// ─── REAL STRIPE FORM ─────────────────────────────────────────────────────────
function RealStripeForm({ items, cartTotal, onSuccess }) {
  const stripe   = useStripe()
  const elements = useElements()
  const { dispatch } = useStore()
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handlePay() {
    if (!stripe || !elements) return
    if (!name.trim()) { setError('Introduce el nombre del titular.'); return }
    setError('')
    setLoading(true)

    try {
      // 1. Crear PaymentIntent en el backend (Vercel Edge Function)
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(cartTotal * 100), currency: 'eur' }),
      })
      const { clientSecret, error: serverError } = await res.json()
      if (serverError) throw new Error(serverError)

      // 2. Confirmar el pago con Stripe.js
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name },
        },
      })

      if (stripeError) throw new Error(stripeError.message)

      dispatch({ type: 'CART_CLEAR' })
      onSuccess({ id: paymentIntent.id, simulated: false })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    style: {
      base: {
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '15px',
        color: '#0f0e0d',
        '::placeholder': { color: '#8a8680' },
      },
    },
  }

  return (
    <div className="checkout-form-wrap">
      <div className="checkout-grid">
        <div className="checkout-form">
          <h2>Datos de pago</h2>

          <div className="form-row">
            <label>Titular de la tarjeta</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre Apellido"
            />
          </div>

          <div className="form-row">
            <label>Tarjeta</label>
            <div className="stripe-card-wrap">
              <CardElement options={cardStyle} />
            </div>
          </div>

          {error && (
            <div className="checkout-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button className="pay-btn" onClick={handlePay} disabled={loading || !stripe}>
            {loading
              ? <><span className="spinner" />Procesando…</>
              : <><Lock size={16} />Pagar {cartTotal.toFixed(2)} €</>
            }
          </button>
          <p className="pay-note"><Lock size={12} /> Pago seguro con Stripe</p>
        </div>

        <OrderSummary items={items} cartTotal={cartTotal} />
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { cart, products, cartTotal } = useStore()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)

  const items = cart
    .map(i => ({ ...i, product: products.find(p => p.id === i.productId) }))
    .filter(i => i.product)

  if (result) return (
    <div>
      <Navbar />
      <SuccessScreen paymentId={result.id} simulated={result.simulated} />
    </div>
  )

  if (items.length === 0) return (
    <div>
      <Navbar />
      <div className="checkout-empty">
        <p>El carrito está vacío.</p>
        <Link to="/" className="btn-primary">Ver productos</Link>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <main className="checkout-main">
        <div className="checkout-inner">
          <Link to="/carrito" className="checkout-back">
            <ArrowLeft size={16} /> Volver al carrito
          </Link>
          <h1 className="checkout-title">
            <CreditCard size={22} />
            Pago
            {!hasStripe && <span className="sim-pill"><Zap size={12} />Simulación</span>}
          </h1>

          {hasStripe ? (
            <Elements stripe={stripePromise}>
              <RealStripeForm items={items} cartTotal={cartTotal} onSuccess={setResult} />
            </Elements>
          ) : (
            <SimulationForm items={items} cartTotal={cartTotal} onSuccess={setResult} />
          )}
        </div>
      </main>
    </div>
  )
}