import { supabase, hasSupabase } from './supabase'

export const customerSync = {
  async touchLastSeen(userId) {
    if (!hasSupabase || !userId) return
    await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId)
  },

  async ensureProfile(user) {
    if (!hasSupabase || !user?.id) return
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      account_type: 'customer',
    }, { onConflict: 'id' })
  },

  async trackEvent(userId, eventType, productId = null, metadata = {}) {
    if (!hasSupabase || !userId) return
    await supabase.from('customer_events').insert({
      user_id: userId,
      event_type: eventType,
      product_id: productId,
      metadata,
    })
    await this.touchLastSeen(userId)
  },

  async fetchWishlist(userId) {
    if (!hasSupabase || !userId) return []
    const { data } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', userId)
    return (data || []).map(r => r.product_id)
  },

  async syncWishlist(userId, productIds) {
    if (!hasSupabase || !userId) return

    const { data: current } = await supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', userId)

    const currentIds = new Set((current || []).map(r => r.product_id))
    const nextIds = new Set(productIds)

    const toAdd = productIds.filter(id => !currentIds.has(id))
    const toRemove = [...currentIds].filter(id => !nextIds.has(id))

    if (toRemove.length) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', userId)
        .in('product_id', toRemove)
    }

    if (toAdd.length) {
      await supabase.from('wishlist_items').upsert(
        toAdd.map(product_id => ({ user_id: userId, product_id })),
        { onConflict: 'user_id,product_id' },
      )
    }
  },
}
