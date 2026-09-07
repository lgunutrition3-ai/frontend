import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Form, Button, Alert } from 'react-bootstrap'
import './css/Login.css'
import nutritionLogo from '../assets/nutritionlogo.jpg'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [retryAfter, setRetryAfter] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (loading || retryAfter) return
    
    setError('')
    setLoading(true)

    try {
      const result = await login(formData)

      if (result.success) {
        navigate('/dashboard')
        return
      }

      if (result.status === 429) {
        setRetryAfter(result.retryAfter || 300)
        setError('Too many login attempts. Please try again later.')
      } else if (result.status === 401) {
        setError('Invalid username or password. Please try again.')
      } else {
        setError(result.error || 'Login failed. Please try again.')
      }

    } catch (error) {
      console.error('Login error:', error)
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
    <div className="login-page">
      <div className="login-shell">
        <div className="login-brand-panel">
          <div className="login-brand-header">
            <div className="login-brand-badge">
              <i className="bi bi-heart-pulse"></i>
            </div>
            <span>National Nutrition Council</span>
          </div>

          <div className="login-brand-body">
            <h1>Nutrition data, organized for every barangay.</h1>
            <p>Track Consolidatedreports, manage staff access, and generate Documents</p>
          </div>

          <div className="login-brand-features">
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <i className="bi bi-bar-chart-line-fill"></i>
              </div>
              <div className="login-feature-meta">
                <div className="login-feature-value">8</div>
                <div className="login-feature-label">Report modules</div>
              </div>
            </div>
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <div className="login-feature-meta">
                <div className="login-feature-value">100%</div>
                <div className="login-feature-label">Role-based access</div>
              </div>
            </div>
            <div className="login-feature-card">
              <div className="login-feature-icon">
                <i className="bi bi-file-earmark-pdf-fill"></i>
              </div>
              <div className="login-feature-meta">
                <div className="login-feature-value">PDF</div>
                <div className="login-feature-label">One-click summaries</div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-logo-wrap">
            {!logoFailed ? (
              <img
                src={nutritionLogo}
                alt="National Nutrition Council logo"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="login-logo-fallback">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C12 2 6 8.5 6 13.5C6 17.09 8.69 20 12 20C15.31 20 18 17.09 18 13.5C18 8.5 12 2 12 2Z" fill="#3E9B7E"/>
                  <path d="M12 20C12 20 12 16 12 13" stroke="#E1F5EE" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>

          <p className="login-subtitle">Nutrition Management Portal</p>

          {error && (
            <Alert 
              variant={retryAfter ? 'warning' : 'danger'} 
              className="mb-3"
              dismissible
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {retryAfter && (
            <Alert variant="info" className="mb-3">
              <strong>⏳ Rate Limit Exceeded</strong>
              <p className="mb-0 mt-1">
                Please try again in <strong>{formatRetryTime(retryAfter)}</strong>.
              </p>
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="login-form">
            <Form.Group className="mb-3">
              <Form.Label>Username or email</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="Enter your username or email"
                disabled={!!retryAfter}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                  disabled={!!retryAfter}
                />
                <Button
                  variant="link"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  disabled={!!retryAfter}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </Button>
              </div>
            </Form.Group>

            <Button
              type="submit"
              className="w-100 login-submit-btn"
              disabled={loading || !!retryAfter}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>

          <p className="login-help-text">
            Having trouble signing in? <a href="#contact">Contact your administrator</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login