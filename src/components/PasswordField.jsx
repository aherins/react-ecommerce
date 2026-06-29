import React, { useState } from 'react'
import { Eye, EyeOff, RefreshCw, Check, X } from 'lucide-react'
import { generateSecurePassword, getPasswordValidation } from '../lib/password'
import './PasswordField.css'

export default function PasswordField({
  value,
  onChange,
  placeholder = 'Contraseña segura',
  autoComplete = 'new-password',
  showRules = true,
  showGenerate = true,
}) {
  const [visible, setVisible] = useState(false)
  const { checks } = getPasswordValidation(value)
  const showChecklist = showRules && value.length > 0

  function handleGenerate() {
    onChange(generateSecurePassword())
    setVisible(true)
  }

  return (
    <div className={`password-field ${!showGenerate ? 'password-field--simple' : ''}`}>
      <div className="password-field-row">
        <div className={`password-input-wrap ${showChecklist && !checks.every((c) => c.ok) ? 'has-hint' : ''}`}>
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            spellCheck={false}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {showGenerate && (
          <button type="button" className="password-generate" onClick={handleGenerate}>
            <RefreshCw size={14} />
            <span>Generar</span>
          </button>
        )}
      </div>
      {showChecklist && (
        <ul className="password-rules" aria-live="polite">
          {checks.map((rule) => (
            <li key={rule.id} className={rule.ok ? 'ok' : 'pending'}>
              {rule.ok ? <Check size={12} /> : <X size={12} />}
              <span>{rule.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
