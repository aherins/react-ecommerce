import React, { useCallback } from 'react'
import { CatalogProvider, useCatalog } from './CatalogContext'
import { OrdersProvider, useOrders } from './OrdersContext'
import { CartProvider, useCart } from './CartContext'
import { CATALOG_ACTIONS } from './store/catalogSync'
import { ORDER_ACTIONS } from './store/ordersSync'
import { CART_ACTIONS } from './store/cartSync'

export function StoreProvider({ children }) {
  return (
    <CatalogProvider>
      <OrdersProvider>
        <CartProvider>{children}</CartProvider>
      </OrdersProvider>
    </CatalogProvider>
  )
}

export function useStore() {
  const catalog = useCatalog()
  const orders = useOrders()
  const cart = useCart()

  const dispatch = useCallback(async (action) => {
    if (CART_ACTIONS.has(action.type)) {
      cart.dispatch(action)
      return
    }

    if (ORDER_ACTIONS.has(action.type)) {
      if (action.type === 'ADD_ORDER') {
        await orders.dispatch(action)
        for (const item of action.order.items || []) {
          const product = catalog.products.find(p => p.id === item.productId)
          if (!product) continue
          const updated = { ...product, stock: Math.max(0, product.stock - item.qty) }
          await catalog.dispatch({
            type: 'PRODUCT_DECREASE_STOCK',
            productId: item.productId,
            qty: item.qty,
            product: updated,
          })
        }
        return
      }
      await orders.dispatch(action)
      return
    }

    if (CATALOG_ACTIONS.has(action.type)) {
      await catalog.dispatch(action)
    }
  }, [catalog, orders, cart])

  return {
    products: catalog.products,
    categories: catalog.categories,
    coupons: catalog.coupons,
    suppliers: catalog.suppliers,
    shippingCarriers: catalog.shippingCarriers,
    orders: orders.orders,
    cart: cart.cart,
    wishlist: cart.wishlist,
    dispatch,
    cartCount: cart.cartCount,
    cartTotal: cart.cartTotal,
    loading: catalog.loading,
    dbError: catalog.dbError,
  }
}
