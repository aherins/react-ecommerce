import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowLeft, CreditCard } from 'lucide-react'
import CouponInput from '../components/CouponInput'
import { useStore } from '../context/StoreContext'
import { canAddToCart } from '../context/store/stock'
import './CartPage.css'

export default function CartPage() {
  const { cart, products, cartTotal, dispatch } = useStore()
  const navigate = useNavigate()
  const [applied, setApplied] = useState(null)

  const items      = (cart || []).map(i => ({ ...i, product: (products||[]).find(p => p.id === i.productId) })).filter(i => i.product)
  const discount   = applied?.discount   || 0
  const finalTotal = applied?.finalTotal ?? cartTotal

  return (
    <>
      <main className="cart-main">
        <div className="cart-inner">
          <Link to="/" className="cart-back"><ArrowLeft size={16}/> Seguir comprando</Link>
          <h1 className="cart-title">Tu carrito</h1>

          {items.length === 0 ? (
            <div className="cart-empty">
              <p>El carrito está vacío.</p>
              <Link to="/" className="btn-primary">Ver productos</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {items.map(({ product, qty, productId }) => {
                  const canIncrease = canAddToCart(product, cart)
                  return (
                  <div key={productId} className="cart-item">
                    <div className="cart-item-img"><img src={product.image} alt={product.name}/></div>
                    <div className="cart-item-info">
                      <p className="cart-item-name">{product.name}</p>
                      <p className="cart-item-unit">{product.price.toFixed(2)} € / ud</p>
                      {qty >= product.stock && (
                        <p className="cart-item-stock">Stock máximo: {product.stock}</p>
                      )}
                    </div>
                    <div className="cart-item-qty">
                      <button onClick={() => dispatch({ type:'CART_SET_QTY', productId, qty: qty-1 })}><Minus size={14}/></button>
                      <span>{qty}</span>
                      <button
                        onClick={() => dispatch({ type:'CART_SET_QTY', productId, qty: qty+1 })}
                        disabled={!canIncrease}
                      ><Plus size={14}/></button>
                    </div>
                    <p className="cart-item-subtotal">{(product.price * qty).toFixed(2)} €</p>
                    <button className="cart-item-del" onClick={() => dispatch({ type:'CART_REMOVE', productId })}><Trash2 size={16}/></button>
                  </div>
                )})}
              </div>

              <div className="cart-summary">
                <h3>Resumen</h3>

                <div className="cart-coupon-wrap">
                  <CouponInput applied={applied} onApply={setApplied} onRemove={() => setApplied(null)}/>
                </div>

                <div className="summary-row"><span>Subtotal</span><span>{cartTotal.toFixed(2)} €</span></div>
                {discount > 0 && (
                  <div className="summary-row summary-row--discount">
                    <span>Descuento <em>({applied.coupon.code})</em></span>
                    <span>−{discount.toFixed(2)} €</span>
                  </div>
                )}
                {applied?.freeShip && (
                  <div className="summary-row summary-row--discount"><span>Envío</span><span>Gratis 🎉</span></div>
                )}
                {!applied?.freeShip && <div className="summary-row"><span>Envío</span><span>Gratis</span></div>}
                <div className="summary-total"><span>Total</span><span>{finalTotal.toFixed(2)} €</span></div>

                <button className="btn-primary full" onClick={() => navigate('/checkout', { state: { applied } })}>
                  <CreditCard size={16}/>Ir al pago
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
