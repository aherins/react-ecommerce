import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  ArrowLeft, CreditCard, Lock, CheckCircle, AlertCircle, Zap, Truck, Package, Mail,
} from 'lucide-react'
import PageMeta from '../components/PageMeta'
import CouponInput from '../components/CouponInput'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { validateCartStock } from '../context/store/stock'
import { stripePromise, hasStripe, checkStripeBackend, MOCK_CARDS, simulatePayment } from '../lib/stripe'
import {
  sendOrderConfirmation, loadSavedCoupon, saveCoupon,
  EMPTY_SHIPPING, validateShipping,
} from '../lib/checkoutHelpers'
import './CheckoutPage.css'

function ShippingFields({ shipping, onChange, user }) {
  const set = (k, v) => onChange({ ...shipping, [k]: v })
  return (
    <div className="checkout-shipping">
      <h2><Truck size={18}/> Envío</h2>
      {!user && (
        <div className="form-row">
          <label><Mail size={13}/> Email</label>
          <input type="email" required value={shipping.email}
            onChange={e => set('email', e.target.value)} placeholder="tu@email.com"/>
        </div>
      )}
      <div className="form-row">
        <label>Nombre completo</label>
        <input value={shipping.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nombre Apellido"/>
      </div>
      <div className="form-row">
        <label>Teléfono</label>
        <input type="tel" value={shipping.phone} onChange={e => set('phone', e.target.value)} placeholder="+34 600 000 000"/>
      </div>
      <div className="form-row">
        <label>Dirección</label>
        <input value={shipping.line1} onChange={e => set('line1', e.target.value)} placeholder="Calle, número, piso"/>
      </div>
      <div className="form-row">
        <label>Información adicional</label>
        <input value={shipping.line2} onChange={e => set('line2', e.target.value)} placeholder="Opcional"/>
      </div>
      <div className="checkout-shipping-row">
        <div className="form-row">
          <label>Ciudad</label>
          <input value={shipping.city} onChange={e => set('city', e.target.value)}/>
        </div>
        <div className="form-row">
          <label>C.P.</label>
          <input value={shipping.postalCode} onChange={e => set('postalCode', e.target.value)}/>
        </div>
      </div>
      <p className="shipping-note">Envío estándar Península · <strong>Gratis</strong></p>
    </div>
  )
}

function OrderSummary({ items, cartTotal, applied, onApply, onRemove }) {
  const discount = applied?.discount || 0
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
        <div className="summary-row summary-discount">
          <span>Descuento</span><span>−{discount.toFixed(2)} €</span>
        </div>
      )}
      <div className="summary-row"><span>Envío</span><span style={{ color: 'var(--success)' }}>Gratis</span></div>
      <div className="summary-total"><span>Total</span><span>{finalTotal.toFixed(2)} €</span></div>
    </div>
  )
}

function SuccessScreen({ order, items }) {
  const ref = order.id?.slice(-8).toUpperCase()
  return (
    <div className="checkout-success">
      <PageMeta title="Pedido confirmado"/>
      <CheckCircle size={52} color="var(--success)"/>
      <h2>¡Pedido confirmado!</h2>
      <p>Gracias, {order.customerName || 'cliente'}. Hemos recibido tu pedido.</p>
      <div className="success-ref">
        Referencia: <code>{ref}</code>
        {order.simulated && <span className="sim-tag">simulado</span>}
      </div>
      <div className="success-summary">
        {items.map(i => (
          <div key={i.productId} className="success-line">
            <span>{i.product.name} × {i.qty}</span>
            <span>{(i.product.price * i.qty).toFixed(2)} €</span>
          </div>
        ))}
        <div className="success-total"><span>Total</span><strong>{order.total.toFixed(2)} €</strong></div>
      </div>
      {order.email && <p className="success-email">Confirmación enviada a <strong>{order.email}</strong></p>}
      <div className="success-actions">
        <Link to={`/seguimiento/${order.id}`} className="btn-primary">Seguir pedido</Link>
        <Link to="/cuenta/pedidos" className="btn-secondary">Mis pedidos</Link>
        <Link to="/" className="btn-ghost">Seguir comprando</Link>
      </div>
    </div>
  )
}

function SimulationForm({ formProps }) {
  const { items, finalTotal, applied, onApply, onRemove, onSuccess, cart, products, shipping, onShippingChange, user } = formProps
  const [card, setCard] = useState(MOCK_CARDS[0].number)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    const shipErr = validateShipping(shipping, user)
    if (shipErr) { setError(shipErr); return }
    const stockError = validateCartStock(cart, products)
    if (stockError) { setError(stockError); return }
    setError(''); setLoading(true)
    try {
      const result = await simulatePayment({ card })
      await onSuccess({ id: result.id, simulated: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="checkout-form-wrap">
      <div className="sim-banner"><Zap size={14}/><span>Modo simulación — sin credenciales Stripe reales.</span></div>
      <div className="checkout-grid">
        <div className="checkout-form">
          <ShippingFields shipping={shipping} onChange={onShippingChange} user={user}/>
          <h2>Datos de pago</h2>
          <div className="form-row"><label>Tarjeta de prueba</label>
            <div className="mock-cards">
              {MOCK_CARDS.map(c => (
                <label key={c.number} className={`mock-card-option ${card === c.number ? 'selected' : ''}`}>
                  <input type="radio" name="mc" value={c.number} checked={card === c.number} onChange={() => setCard(c.number)}/>
                  <div><code>{c.number}</code><span className={`mock-label ${c.result}`}>{c.label}</span></div>
                </label>
              ))}
            </div>
          </div>
          {error && <div className="checkout-error"><AlertCircle size={16}/>{error}</div>}
          <button className="pay-btn" type="button" onClick={handlePay} disabled={loading}>
            {loading ? <><span className="spinner"/>Procesando…</> : <><Lock size={16}/>Pagar {finalTotal.toFixed(2)} €</>}
          </button>
        </div>
        <OrderSummary items={items} cartTotal={items.reduce((s, i) => s + i.product.price * i.qty, 0)}
          applied={applied} onApply={onApply} onRemove={onRemove}/>
      </div>
    </div>
  )
}

function RealStripeForm({ formProps }) {
  const stripe = useStripe()
  const elements = useElements()
  const { products } = useStore()
  const { items, finalTotal, applied, onApply, onRemove, onSuccess, cart, shipping, onShippingChange, user } = formProps
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    if (!stripe || !elements) return
    const shipErr = validateShipping(shipping, user)
    if (shipErr) { setError(shipErr); return }
    if (!name.trim()) { setError('Introduce el nombre del titular.'); return }
    const stockError = validateCartStock(cart, products)
    if (stockError) { setError(stockError); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, qty: i.qty })),
          couponCode: applied?.coupon?.code || null,
          products: products.map(p => ({ id: p.id, name: p.name, price: p.price, stock: p.stock, active: p.active })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al preparar el pago')
      const { error: se2, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { name, email: user?.email || shipping.email } },
      })
      if (se2) throw new Error(se2.message)
      await onSuccess({ id: paymentIntent.id, simulated: false })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="checkout-form-wrap">
      <div className="checkout-grid">
        <div className="checkout-form">
          <ShippingFields shipping={shipping} onChange={onShippingChange} user={user}/>
          <h2>Datos de pago</h2>
          <div className="form-row"><label>Titular</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Como aparece en la tarjeta"/></div>
          <div className="form-row"><label>Tarjeta</label>
            <div className="stripe-card-wrap">
              <CardElement options={{ style: { base: { fontFamily: '"DM Sans",sans-serif', fontSize: '15px', color: '#0f0e0d' } } }}/>
            </div>
          </div>
          {error && <div className="checkout-error"><AlertCircle size={16}/>{error}</div>}
          <button className="pay-btn" type="button" onClick={handlePay} disabled={loading || !stripe}>
            {loading ? <><span className="spinner"/>Procesando…</> : <><Lock size={16}/>Pagar {finalTotal.toFixed(2)} €</>}
          </button>
          <p className="pay-note"><Lock size={12}/> Pago seguro con Stripe</p>
        </div>
        <OrderSummary items={items} cartTotal={items.reduce((s, i) => s + i.product.price * i.qty, 0)}
          applied={applied} onApply={onApply} onRemove={onRemove}/>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const { cart, products, cartTotal, dispatch } = useStore()
  const { user } = useAuth()
  const location = useLocation()
  const [completedOrder, setCompletedOrder] = useState(null)
  const [completedItems, setCompletedItems] = useState([])
  const [applied, setApplied] = useState(location.state?.applied || loadSavedCoupon())
  const [shipping, setShipping] = useState({
    ...EMPTY_SHIPPING,
    email: user?.email || '',
    fullName: user?.user_metadata?.full_name || '',
  })
  const [useSimulation, setUseSimulation] = useState(!hasStripe)
  const [checkingStripe, setCheckingStripe] = useState(hasStripe)
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    if (user?.email) setShipping(s => ({ ...s, email: user.email }))
    if (user?.user_metadata?.full_name) setShipping(s => ({ ...s, fullName: user.user_metadata.full_name }))
  }, [user])

  useEffect(() => {
    saveCoupon(applied)
  }, [applied])

  useEffect(() => {
    if (!hasStripe) return
    let cancelled = false
    checkStripeBackend().then(ok => {
      if (!cancelled) { setUseSimulation(!ok); setCheckingStripe(false) }
    })
    return () => { cancelled = true }
  }, [])

  const items = (cart || []).map(i => ({
    ...i,
    product: (products || []).find(p => p.id === i.productId),
  })).filter(i => i.product)

  const discount = applied?.discount || 0
  const finalTotal = applied?.finalTotal ?? cartTotal

  async function handleSuccess(payment) {
    setCheckoutError('')
    const email = (user?.email || shipping.email || '').trim()
    const order = {
      id: payment.id,
      paymentId: payment.id,
      userId: user?.id || null,
      email,
      customerName: shipping.fullName.trim(),
      customerPhone: shipping.phone.trim() || null,
      shippingAddress: {
        line1: shipping.line1.trim(),
        line2: shipping.line2.trim() || null,
        city: shipping.city.trim(),
        postalCode: shipping.postalCode.trim(),
        country: shipping.country,
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
      total: finalTotal,
      subtotal: cartTotal,
      discount,
      couponCode: applied?.coupon?.code || null,
      items: (cart || []).map(i => ({ productId: i.productId, qty: i.qty, price: products.find(p => p.id === i.productId)?.price })),
      simulated: Boolean(payment.simulated),
    }
    try {
      await dispatch({ type: 'ADD_ORDER', order })
      if (applied?.coupon) await dispatch({ type: 'COUPON_USE', id: applied.coupon.id })
      saveCoupon(null)
      await sendOrderConfirmation(order, items)
      dispatch({ type: 'CART_CLEAR' })
      setCompletedItems(items)
      setCompletedOrder(order)
    } catch (err) {
      setCheckoutError(err.message || 'No se pudo guardar el pedido. Contacta con soporte.')
    }
  }

  if (completedOrder) {
    return <SuccessScreen order={completedOrder} items={completedItems}/>
  }

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <PageMeta title="Checkout"/>
        <Package size={40}/>
        <p>El carrito está vacío.</p>
        <Link to="/" className="btn-primary">Ver productos</Link>
      </div>
    )
  }

  const formProps = {
    items, finalTotal, applied,
    onApply: setApplied,
    onRemove: () => setApplied(null),
    onSuccess: handleSuccess,
    cart, products, shipping,
    onShippingChange: setShipping,
    user,
  }

  return (
    <main className="checkout-main">
      <PageMeta title="Checkout"/>
      <div className="checkout-inner">
        <Link to="/carrito" className="checkout-back"><ArrowLeft size={16}/> Volver al carrito</Link>
        <h1 className="checkout-title">
          <CreditCard size={22}/>Pago
          {useSimulation && <span className="sim-pill"><Zap size={12}/>Simulación</span>}
        </h1>
        {checkoutError && <div className="checkout-error banner"><AlertCircle size={16}/>{checkoutError}</div>}
        {checkingStripe ? (
          <div className="checkout-loading"><span className="spinner"/>Preparando pago…</div>
        ) : useSimulation ? (
          <SimulationForm formProps={formProps}/>
        ) : (
          <Elements stripe={stripePromise}><RealStripeForm formProps={formProps}/></Elements>
        )}
      </div>
    </main>
  )
}
