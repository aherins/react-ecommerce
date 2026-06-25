import { supabase, hasSupabase } from '../../lib/supabase'
import { couponToDb } from './couponMappers'

export async function syncCatalogAction(action) {
  if (!hasSupabase) return

  switch (action.type) {
    case 'PRODUCT_ADD': {
      const { id, ...rest } = action.product
      const { error } = await supabase.from('products').insert({ id, ...rest })
      if (error) console.error('PRODUCT_ADD:', error.message)
      break
    }
    case 'PRODUCT_UPDATE': {
      const { id, ...rest } = action.product
      const { error } = await supabase.from('products').update(rest).eq('id', id)
      if (error) console.error('PRODUCT_UPDATE:', error.message)
      break
    }
    case 'PRODUCT_DELETE': {
      const { error } = await supabase.from('products').delete().eq('id', action.id)
      if (error) console.error('PRODUCT_DELETE:', error.message)
      break
    }
    case 'PRODUCT_DECREASE_STOCK': {
      const product = action.product
      if (!product) break
      const { error } = await supabase.from('products').update({ stock: product.stock }).eq('id', product.id)
      if (error) console.error('PRODUCT_DECREASE_STOCK:', error.message)
      break
    }

    case 'CATEGORY_ADD': {
      const { id, ...rest } = action.category
      const { error } = await supabase.from('categories').insert({ id, ...rest })
      if (error) console.error('CATEGORY_ADD:', error.message)
      break
    }
    case 'CATEGORY_UPDATE': {
      const { id, ...rest } = action.category
      const { error } = await supabase.from('categories').update(rest).eq('id', id)
      if (error) console.error('CATEGORY_UPDATE:', error.message)
      break
    }
    case 'CATEGORY_DELETE': {
      const { error } = await supabase.from('categories').delete().eq('id', action.id)
      if (error) console.error('CATEGORY_DELETE:', error.message)
      break
    }

    case 'COUPON_ADD': {
      const { error } = await supabase.from('coupons').insert(couponToDb(action.coupon))
      if (error) console.error('COUPON_ADD:', error.message)
      break
    }
    case 'COUPON_UPDATE': {
      const { id, ...rest } = couponToDb(action.coupon)
      const { error } = await supabase.from('coupons').update(rest).eq('id', id)
      if (error) console.error('COUPON_UPDATE:', error.message)
      break
    }
    case 'COUPON_TOGGLE_ACTIVE': {
      const { error } = await supabase.from('coupons').update({ active: action.active }).eq('id', action.id)
      if (error) console.error('COUPON_TOGGLE_ACTIVE:', error.message)
      break
    }
    case 'COUPON_DELETE': {
      const { error } = await supabase.from('coupons').delete().eq('id', action.id)
      if (error) console.error('COUPON_DELETE:', error.message)
      break
    }
    case 'COUPON_USE': {
      const { error } = await supabase.rpc('increment_coupon_use', { p_id: action.id })
      if (error) console.error('COUPON_USE:', error.message)
      break
    }
  }
}

export const CATALOG_ACTIONS = new Set([
  'SET_PRODUCTS', 'PRODUCT_ADD', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_DECREASE_STOCK',
  'SET_CATEGORIES', 'CATEGORY_ADD', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
  'SET_COUPONS', 'COUPON_ADD', 'COUPON_UPDATE', 'COUPON_TOGGLE_ACTIVE', 'COUPON_DELETE', 'COUPON_USE',
])
