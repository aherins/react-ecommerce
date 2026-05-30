import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowLeft, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useStore } from '../context/StoreContext'
import './CartPage.css'

export default function CartPage() {
  const { cart, products, cartTotal, dispatch } = useStore()
  const [ordered, setOrdered] = useState(false)

  const items = cart.map(i => ({ ...i, product: products.find(p => p.id === i.productId) })).filter(i => i.product)

  function handleOrder() {
    dispatch({ type: 'CART_CLEAR' })
    setOrdered(true)
  }

  if (ordered) return (
    <div>
      <Navbar />
      <div className="cart-success">
        <CheckCircle size={48} color="var(--success)" />
        <h2>¡Pedido confirmado!</h2>
        <p>Gracias por tu compra. Recibirás confirmación por email.</p>
        <Link to="/" className="btn-primary">Seguir comprando</Link>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <main className="cart-main">
        <div className="cart-inner">
          <Link to="/" className="cart-back"><ArrowLeft size={16} /> Seguir comprando</Link>
          <h1 className="cart-title">Tu carrito</h1>

          {items.length === 0 ? (
            <div className="cart-empty">
              <p>El carrito está vacío.</p>
              <Link to="/" className="btn-primary">Ver productos</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {items.map(({ product, qty, productId }) => (
                  <div key={productId} className="cart-item">
                    <div className="cart-item-img">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="cart-item-info">
                      <p className="cart-item-name">{product.name}</p>
                      <p className="cart-item-unit">{product.price.toFixed(2)} € / ud</p>
                    </div>
                    <div className="cart-item-qty">
                      <button onClick={() => dispatch({ type: 'CART_SET_QTY', productId, qty: qty - 1 })}>
                        <Minus size={14} />
                      </button>
                      <span>{qty}</span>
                      <button onClick={() => dispatch({ type: 'CART_SET_QTY', productId, qty: qty + 1 })}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="cart-item-subtotal">{(product.price * qty).toFixed(2)} €</p>
                    <button className="cart-item-del" onClick={() => dispatch({ type: 'CART_REMOVE', productId })}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h3>Resumen</h3>
                <div className="summary-row"><span>Subtotal</span><span>{cartTotal.toFixed(2)} €</span></div>
                <div className="summary-row"><span>Envío</span><span>Gratis</span></div>
                <div className="summary-total"><span>Total</span><span>{cartTotal.toFixed(2)} €</span></div>
                <button className="btn-primary full" onClick={handleOrder}>Confirmar pedido</button>
                <p className="summary-note">Este es un MVP — no se procesa pago real.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
