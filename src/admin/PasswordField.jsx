import { useState } from 'react'
import { PASSWORD_RULES } from './passwordRules'

const inputCls = 'w-full px-3 py-2.5 pr-10 bg-primary border border-surface-border rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent-cyan/50 transition-all'

// Password input with a show/hide eye toggle.
export function PasswordInput({ value, onChange, placeholder = 'Enter password', autoFocus }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} className={inputCls} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
        <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
      </button>
    </div>
  )
}

// The X/check rule checklist shown under the password field.
export function PasswordChecklist({ value }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value || '')
        return (
          <div key={r.key} className={`flex items-center gap-1.5 text-[12px] font-mono ${ok ? 'text-accent-green' : 'text-red-400'}`}>
            <i className={`bi ${ok ? 'bi-check-lg' : 'bi-x-lg'}`} /> {r.label}
          </div>
        )
      })}
    </div>
  )
}
