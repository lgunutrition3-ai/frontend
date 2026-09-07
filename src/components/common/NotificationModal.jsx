import { useEffect } from 'react'
import './css/NotificationModal.css'

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path d="M12 7v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.3" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
      <path d="M12 11v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.3" fill="currentColor" />
    </svg>
  ),
}

const NotificationModal = ({ show, variant = 'success', title = '', message = '', autoClose = 3500, onClose }) => {
  useEffect(() => {
    if (!show || !autoClose) return
    const timer = setTimeout(onClose, autoClose)
    return () => clearTimeout(timer)
  }, [show, autoClose, onClose])

  if (!show) return null

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div
        className={`notification-modal notification-modal-${variant}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="notification-icon">{ICONS[variant]}</div>
        <div className="notification-content">
          {title && <h6 className="notification-title">{title}</h6>}
          <p className="notification-message">{message}</p>
        </div>
        <button
          type="button"
          className="notification-close"
          aria-label="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default NotificationModal