import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { hasSupabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { ordersReducer } from './store/ordersReducer'
import { fetchOrders, syncOrderAction } from './store/ordersSync'
import { orderFromDb } from './store/orderMappers'
import { loadLocal, saveLocal } from './store/helpers'

const ORDERS_KEY = 'orders'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(ordersReducer, { orders: [] })

  const load = useCallback(async () => {
    if (!hasSupabase) {
      dispatch({ type: 'SET_ORDERS', orders: loadLocal(ORDERS_KEY) })
      return
    }
    try {
      const rows = await fetchOrders()
      dispatch({ type: 'SET_ORDERS', orders: rows.map(orderFromDb) })
    } catch (e) {
      console.warn('Orders load error:', e.message)
      dispatch({ type: 'SET_ORDERS', orders: loadLocal(ORDERS_KEY) })
    }
  }, [])

  useEffect(() => { load() }, [load, user?.id])

  useEffect(() => {
    if (!hasSupabase) saveLocal(ORDERS_KEY, state.orders)
  }, [state.orders])

  const smartDispatch = useCallback(async (action) => {
    if (action.type === 'ADD_ORDER') {
      await syncOrderAction(action)
      dispatch(action)
      if (!hasSupabase) saveLocal(ORDERS_KEY, [...state.orders, action.order])
      return
    }
    dispatch(action)
    await syncOrderAction(action)
  }, [state.orders])

  return (
    <OrdersContext.Provider value={{ orders: state.orders, dispatch: smartDispatch, reloadOrders: load }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders debe usarse dentro de OrdersProvider')
  return ctx
}
