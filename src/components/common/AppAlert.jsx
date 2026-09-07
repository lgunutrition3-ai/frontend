import { useState } from 'react'
import './css/AppAlert.css'

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3.5l9.5 16.5H2.5L12 3.5z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 9.5v4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.1" fill="currentColor" />
    </svg>
  ),
}

const AppAlert = ({ variant = 'info', title, dismissible = false, onClose, children }) => {
  const [closed, setClosed] = useState(false)

  if (closed) return null

  const handleClose = () => {
    setClosed(true)
    onClose?.()
  }

  return (
    <div className={`app-alert app-alert-${variant}`} role="alert">
      <span className="app-alert-icon">{ICONS[variant]}</span>
      <div className="app-alert-content">
        {title && <strong className="app-alert-title">{title}</strong>}
        <div>{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="app-alert-close"
          aria-label="Close"
          onClick={handleClose}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default AppAlert