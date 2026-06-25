import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { hasSupabase } from '../lib/supabase'
import { ordersReducer } from './store/ordersReducer'
import { fetchOrders, syncOrderAction } from './store/ordersSync'
import { orderFromDb } from './store/orderMappers'
import { loadLocal, saveLocal } from './store/helpers'

const ORDERS_KEY = 'orders'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const [state, dispatch] = useReducer(ordersReducer, { orders: [] })

  useEffect(() => {
    if (!hasSupabase) {
      dispatch({ type: 'SET_ORDERS', orders: loadLocal(ORDERS_KEY) })
      return
    }

    fetchOrders()
      .then(rows => {
        if (rows.length) dispatch({ type: 'SET_ORDERS', orders: rows.map(orderFromDb) })
      })
      .catch(e => console.warn('Orders load error:', e.message))
  }, [])

  useEffect(() => {
    if (!hasSupabase) saveLocal(ORDERS_KEY, state.orders)
  }, [state.orders])

  const smartDispatch = useCallback(async (action) => {
    dispatch(action)
    await syncOrderAction(action)
  }, [])

  return (
    <OrdersContext.Provider value={{
      orders: state.orders,
      dispatch: smartDispatch,
    }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders debe usarse dentro de OrdersProvider')
  return ctx
}
