import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { FaInfoCircle } from 'react-icons/fa'
import './css/inputGuide.css'

export function GuideToggle({ open, onClick }) {
  return (
    <Button
      variant="link"
      size="sm"
      className="p-0 text-decoration-none"
      onClick={onClick}
    >
      <FaInfoCircle className="me-1" />
      {open ? 'Hide Input Guide' : 'Input Guide'}
    </Button>
  )
}

export function GuidePanel({ open, children }) {
  if (!open) return null
  return (
    <Alert variant="info" className="small mb-3 input-guide">
      {children}
    </Alert>
  )
}
