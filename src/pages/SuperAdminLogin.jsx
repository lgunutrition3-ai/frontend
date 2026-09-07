import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Form, Button, Alert } from 'react-bootstrap'
import nutritionLogo from '../assets/nutritionlogo.jpg'
import LoadingOverlay from '../components/common/LoadingOverlay'
import './css/SuperAdminLogin.css'

const SuperAdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [retryAfter, setRetryAfter] = useState(null)
  const { superadminLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (loading || retryAfter) return

    setError('')
    setLoading(true)

    try {
      const result = await superadminLogin(formData)

      if (result.success) {
        navigate('/superadmin')
        return
      }

      if (result.status === 429) {
        setRetryAfter(result.retryAfter || 300)
        setError('Too many login attempts. Please try again later.')
      } else if (result.status === 401) {
        setError('Invalid super admin credentials. Please try again.')
      } else {
        setError(result.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Super admin login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatRetryTime = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`
    const minutes = Math.ceil(seconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  return (
    <div className="superadmin-login-page">
      <LoadingOverlay show={loading} message="Authenticating..." />
      
      <div className="superadmin-login-container">
        <div className="superadmin-login-card">
          <div className="superadmin-login-header">
            <div className="superadmin-login-logo">
              {!logoFailed ? (
                <img
                  src={nutritionLogo}
                  alt="National Nutrition Council"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="superadmin-logo-fallback">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C12 2 6 8.5 6 13.5C6 17.09 8.69 20 12 20C15.31 20 18 17.09 18 13.5C18 8.5 12 2 12 2Z" fill="#0B4F4A"/>
                    <path d="M12 20C12 20 12 16 12 13" stroke="#E1F5EE" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>
            <h1 className="superadmin-login-title">Super Admin</h1>
            <p className="superadmin-login-subtitle">Restricted system administration access</p>
          </div>

          <div className="superadmin-login-divider">
            <span>Secure Login</span>
          </div>

          {error && (
            <Alert
              variant={retryAfter ? 'warning' : 'danger'}
              className="superadmin-alert"
              dismissible
              onClose={() => setError('')}
            >
              <i className={`bi ${retryAfter ? 'bi-exclamation-triangle' : 'bi-exclamation-circle'} me-2`}></i>
              {error}
            </Alert>
          )}

          {retryAfter && (
            <Alert variant="info" className="superadmin-alert">
              <i className="bi bi-clock-history me-2"></i>
              <strong>Rate Limit Exceeded</strong>
              <p className="mb-0 mt-1">
                Please try again in <strong>{formatRetryTime(retryAfter)}</strong>.
              </p>
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="superadmin-login-form">
            <Form.Group className="superadmin-form-group">
              <Form.Label>
                <i className="bi bi-person"></i> Username or Email
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="Enter your username or email"
                disabled={!!retryAfter}
                className="superadmin-input"
              />
            </Form.Group>

            <Form.Group className="superadmin-form-group">
              <Form.Label>
                <i className="bi bi-lock"></i> Password
              </Form.Label>
              <div className="superadmin-password-wrapper">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  disabled={!!retryAfter}
                  className="superadmin-input"
                />
                <Button
                  variant="link"
                  className="superadmin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  disabled={!!retryAfter}
                >
                  {showPassword ? (
                    <i className="bi bi-eye-slash"></i>
                  ) : (
                    <i className="bi bi-eye"></i>
                  )}
                </Button>
              </div>
            </Form.Group>

            <Button
              type="submit"
              className="superadmin-submit-btn"
              disabled={loading || !!retryAfter}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Authenticating...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-lock me-2"></i>
                  Sign in as Super Admin
                </>
              )}
            </Button>
          </Form>

          <div className="superadmin-login-footer">
            <p className="superadmin-footer-text">
              <i className="bi bi-shield-check me-1"></i>
              Secure, encrypted connection
            </p>
            <a href="/login" className="superadmin-back-link">
              <i className="bi bi-arrow-left me-1"></i>
              Back to User Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLogin