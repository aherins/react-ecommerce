import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'
import { catalogReducer } from './store/catalogReducer'
import { syncCatalogAction } from './store/catalogSync'
import { couponFromDb } from './store/couponMappers'
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '../lib/demoData'
import { SEED_COUPONS } from '../lib/coupons'
import { loadLocal, saveLocal } from './store/helpers'

const DEMO_CATALOG_KEY = 'demo_catalog'

const CatalogContext = createContext(null)

export function CatalogProvider({ children }) {
  const [state, dispatch] = useReducer(catalogReducer, {
    products: [],
    categories: [],
    coupons: [],
  })
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(null)

  useEffect(() => {
    if (!hasSupabase) {
      const saved = loadLocal(DEMO_CATALOG_KEY)
      if (saved?.products?.length) {
        dispatch({ type: 'SET_PRODUCTS', products: saved.products })
        dispatch({ type: 'SET_CATEGORIES', categories: saved.categories })
        dispatch({ type: 'SET_COUPONS', coupons: saved.coupons || SEED_COUPONS })
      } else {
        dispatch({ type: 'SET_PRODUCTS', products: DEMO_PRODUCTS })
        dispatch({ type: 'SET_CATEGORIES', categories: DEMO_CATEGORIES })
        dispatch({ type: 'SET_COUPONS', coupons: SEED_COUPONS })
        saveLocal(DEMO_CATALOG_KEY, {
          products: DEMO_PRODUCTS,
          categories: DEMO_CATEGORIES,
          coupons: SEED_COUPONS,
        })
      }
      setLoading(false)
      return
    }

    Promise.all([
      supabase.from('products').select('*').order('created_at'),
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('coupons').select('*').order('created_at'),
    ])
      .then(([{ data: products, error: ep }, { data: categories, error: ec }, { data: couponsRaw, error: ecp }]) => {
        if (ep) throw ep
        if (ec) throw ec
        if (ecp) console.warn('Coupons load error:', ecp.message)
        if (products?.length) dispatch({ type: 'SET_PRODUCTS', products })
        if (categories?.length) dispatch({ type: 'SET_CATEGORIES', categories })
        if (couponsRaw?.length) dispatch({ type: 'SET_COUPONS', coupons: couponsRaw.map(couponFromDb) })
      })
      .catch(e => setDbError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!hasSupabase) return

    const ch = supabase.channel('shop-catalog-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        supabase.from('products').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_PRODUCTS', products: data }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_CATEGORIES', categories: data }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        supabase.from('coupons').select('*').order('created_at')
          .then(({ data }) => data && dispatch({ type: 'SET_COUPONS', coupons: data.map(couponFromDb) }))
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [])

  const smartDispatch = useCallback(async (action) => {
    dispatch(action)
    await syncCatalogAction(action)
  }, [])

  return (
    <CatalogContext.Provider value={{
      products: state.products,
      categories: state.categories,
      coupons: state.coupons,
      dispatch: smartDispatch,
      loading,
      dbError,
    }}>
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog() {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog debe usarse dentro de CatalogProvider')
  return ctx
}
