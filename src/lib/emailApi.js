import { supabase, hasSupabase } from './supabase'

export async function notifyStockRestored({ productId, productName, productPrice, image }) {
  if (!hasSupabase) return

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    await fetch('/api/notify-stock-alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ productId, productName, productPrice, image }),
    })
  } catch (err) {
    console.warn('Stock alert emails:', err.message)
  }
}
