import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  checkStockAlert,
  subscribeStockAlert,
  unsubscribeStockAlert,
  getLocalAlertEmail,
} from '../lib/stockAlerts'

export function useStockAlert(productId) {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email || getLocalAlertEmail(productId) || '')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const addr = user?.email || email || getLocalAlertEmail(productId)
      if (addr) {
        const active = await checkStockAlert(productId, addr)
        if (!cancelled) {
          setSubscribed(active)
          if (active) setEmail(addr)
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [productId, user?.email])

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user?.email])

  async function subscribe(e) {
    e?.preventDefault?.()
    setError('')
    setMessage('')
    setSubmitting(true)
    const result = await subscribeStockAlert({
      productId,
      email,
      userId: user?.id,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setSubscribed(true)
    setMessage(result.already
      ? 'Ya tenías activada la alerta para este producto.'
      : '¡Listo! Te avisaremos cuando vuelva a haber stock.')
    return true
  }

  async function unsubscribe() {
    setError('')
    setMessage('')
    setSubmitting(true)
    const result = await unsubscribeStockAlert({ productId, email })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setSubscribed(false)
    setMessage('Has cancelado el aviso de stock.')
    return true
  }

  return {
    user,
    email,
    setEmail,
    subscribed,
    loading,
    submitting,
    message,
    error,
    setError,
    subscribe,
    unsubscribe,
    isAuthenticated: Boolean(user),
  }
}
