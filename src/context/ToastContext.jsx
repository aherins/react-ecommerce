import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import './Toast.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'success') => {
    if (!message) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 4200)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            {t.type === 'error'
              ? <AlertCircle size={18} className="toast-icon" aria-hidden="true"/>
              : <CheckCircle size={18} className="toast-icon" aria-hidden="true"/>}
            <span className="toast-msg">{t.message}</span>
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Cerrar">
              <X size={14}/>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx?.toast ?? (() => {})
}
