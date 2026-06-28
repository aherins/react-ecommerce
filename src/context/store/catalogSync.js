import { supabase, hasSupabase } from '../../lib/supabase'
import { couponToDb } from './couponMappers'
import { supplierToDb, shippingCarrierToDb } from './partnerMappers'
import { productToDb, mapProductsFromDb } from './productMappers'
import { supplierOrderToDb, supplierOrderFromDb } from './supplierOrderMappers'
import { applyStockToSupplierOrderLine } from '../../lib/suppliers'

export async function syncCatalogAction(action) {
  if (!hasSupabase) return

  switch (action.type) {
    case 'PRODUCT_ADD': {
      const row = productToDb(action.product)
      const { id, ...rest } = row
      const { error } = await supabase.from('products').insert({ id, ...rest })
      if (error) console.error('PRODUCT_ADD:', error.message)
      break
    }
    case 'PRODUCT_UPDATE': {
      const row = productToDb(action.product)
      const { id, ...rest } = row
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

    case 'SUPPLIER_ADD': {
      const { error } = await supabase.from('suppliers').insert(supplierToDb(action.supplier))
      if (error) console.error('SUPPLIER_ADD:', error.message)
      break
    }
    case 'SUPPLIER_UPDATE': {
      const { id, ...rest } = supplierToDb(action.supplier)
      const { error } = await supabase.from('suppliers').update(rest).eq('id', id)
      if (error) console.error('SUPPLIER_UPDATE:', error.message)
      break
    }
    case 'SUPPLIER_DELETE': {
      const { error } = await supabase.from('suppliers').delete().eq('id', action.id)
      if (error) console.error('SUPPLIER_DELETE:', error.message)
      break
    }

    case 'SHIPPING_CARRIER_ADD': {
      const { error } = await supabase.from('shipping_carriers').insert(shippingCarrierToDb(action.carrier))
      if (error) console.error('SHIPPING_CARRIER_ADD:', error.message)
      break
    }
    case 'SHIPPING_CARRIER_UPDATE': {
      const { id, ...rest } = shippingCarrierToDb(action.carrier)
      const { error } = await supabase.from('shipping_carriers').update(rest).eq('id', id)
      if (error) console.error('SHIPPING_CARRIER_UPDATE:', error.message)
      break
    }
    case 'SHIPPING_CARRIER_DELETE': {
      const { error } = await supabase.from('shipping_carriers').delete().eq('id', action.id)
      if (error) console.error('SHIPPING_CARRIER_DELETE:', error.message)
      break
    }

    case 'SUPPLIER_ORDER_ADD': {
      const { error } = await supabase.from('supplier_orders').insert(supplierOrderToDb(action.order))
      if (error) console.error('SUPPLIER_ORDER_ADD:', error.message)
      break
    }
    case 'SUPPLIER_ORDER_UPDATE': {
      const { id, ...rest } = supplierOrderToDb(action.order)
      const { error } = await supabase.from('supplier_orders').update(rest).eq('id', id)
      if (error) console.error('SUPPLIER_ORDER_UPDATE:', error.message)
      break
    }
    case 'SUPPLIER_ORDER_DELETE': {
      const { error } = await supabase.from('supplier_orders').delete().eq('id', action.id)
      if (error) console.error('SUPPLIER_ORDER_DELETE:', error.message)
      break
    }
    case 'SUPPLIER_ORDER_ADD_INVOICE': {
      const { data, error: selErr } = await supabase
        .from('supplier_orders').select('invoices,stock_locked_at').eq('id', action.id).maybeSingle()
      if (selErr) { console.error('SUPPLIER_ORDER_ADD_INVOICE:', selErr.message); break }
      if (data?.stock_locked_at) break
      const invoices = [...(data?.invoices || []), action.invoice]
      const { error } = await supabase.from('supplier_orders').update({ invoices }).eq('id', action.id)
      if (error) console.error('SUPPLIER_ORDER_ADD_INVOICE:', error.message)
      break
    }
    case 'SUPPLIER_ORDER_REMOVE_INVOICE': {
      const { data, error: selErr } = await supabase
        .from('supplier_orders').select('invoices,stock_locked_at').eq('id', action.id).maybeSingle()
      if (selErr) { console.error('SUPPLIER_ORDER_REMOVE_INVOICE:', selErr.message); break }
      if (data?.stock_locked_at) break
      const invoices = (data?.invoices || []).filter(inv => inv.id !== action.invoiceId)
      const { error } = await supabase.from('supplier_orders').update({ invoices }).eq('id', action.id)
      if (error) console.error('SUPPLIER_ORDER_REMOVE_INVOICE:', error.message)
      break
    }
    case 'SUPPLIER_ORDER_APPLY_STOCK': {
      const { data: orderRow, error: orderErr } = await supabase
        .from('supplier_orders').select('*').eq('id', action.orderId).maybeSingle()
      if (orderErr || !orderRow) {
        console.error('SUPPLIER_ORDER_APPLY_STOCK:', orderErr?.message || 'Pedido no encontrado')
        break
      }
      const order = supplierOrderFromDb(orderRow)
      const line = order.items?.[action.lineIndex]
      if (!line?.productId) break
      const { data: productRow, error: productErr } = await supabase
        .from('products').select('*').eq('id', line.productId).maybeSingle()
      if (productErr || !productRow) {
        console.error('SUPPLIER_ORDER_APPLY_STOCK:', productErr?.message || 'Producto no encontrado')
        break
      }
      const result = applyStockToSupplierOrderLine(
        order,
        action.lineIndex,
        mapProductsFromDb([productRow]),
      )
      if (!result) break
      const { error: stockErr } = await supabase
        .from('products')
        .update({ stock: result.product.stock })
        .eq('id', result.product.id)
      if (stockErr) console.error('SUPPLIER_ORDER_APPLY_STOCK stock:', stockErr.message)
      const { id, ...rest } = supplierOrderToDb(result.order)
      const { error: orderUpdErr } = await supabase.from('supplier_orders').update(rest).eq('id', id)
      if (orderUpdErr) console.error('SUPPLIER_ORDER_APPLY_STOCK order:', orderUpdErr.message)
      break
    }
  }
}

export const CATALOG_ACTIONS = new Set([
  'SET_PRODUCTS', 'PRODUCT_ADD', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_DECREASE_STOCK',
  'SET_CATEGORIES', 'CATEGORY_ADD', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
  'SET_COUPONS', 'COUPON_ADD', 'COUPON_UPDATE', 'COUPON_TOGGLE_ACTIVE', 'COUPON_DELETE', 'COUPON_USE',
  'SET_SUPPLIERS', 'SUPPLIER_ADD', 'SUPPLIER_UPDATE', 'SUPPLIER_DELETE',
  'SET_SHIPPING_CARRIERS', 'SHIPPING_CARRIER_ADD', 'SHIPPING_CARRIER_UPDATE', 'SHIPPING_CARRIER_DELETE',
  'SET_SUPPLIER_ORDERS', 'SUPPLIER_ORDER_ADD', 'SUPPLIER_ORDER_UPDATE', 'SUPPLIER_ORDER_DELETE',
  'SUPPLIER_ORDER_ADD_INVOICE', 'SUPPLIER_ORDER_REMOVE_INVOICE', 'SUPPLIER_ORDER_APPLY_STOCK',
])
