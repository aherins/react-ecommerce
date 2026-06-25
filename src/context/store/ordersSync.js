import { supabase, hasSupabase } from '../../lib/supabase'
import { orderToDb } from './orderMappers'

export async function syncOrderAction(action) {
  if (!hasSupabase) return

  switch (action.type) {
    case 'ADD_ORDER': {
      const { error } = await supabase.from('orders').insert(orderToDb(action.order))
      if (error) throw new Error(error.message)
      break
    }
    case 'ORDER_UPDATE': {
      const patch = {}
      if (action.patch.status !== undefined) patch.status = action.patch.status
      if (action.patch.trackingNumber !== undefined) patch.tracking_number = action.patch.trackingNumber
      if (action.patch.carrierId !== undefined) patch.carrier_id = action.patch.carrierId
      if (Object.keys(patch).length === 0) break
      const { error } = await supabase.from('orders').update(patch).eq('id', action.id)
      if (error) throw new Error(error.message)
      break
    }
  }
}

export const ORDER_ACTIONS = new Set(['SET_ORDERS', 'ADD_ORDER', 'ORDER_UPDATE'])

export async function fetchOrders() {
  if (!hasSupabase) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}
