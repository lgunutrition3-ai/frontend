import { useNavigate } from 'react-router-dom'
import { Modal, Button } from 'react-bootstrap'
import { useTheme, THEME_OPTIONS } from '../../context/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import './css/SettingsModal.css'

const SettingsModal = ({ show, onClose }) => {
  const { theme, setTheme, accent, setAccent } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }

  return (
    <Modal show={show} onHide={onClose} centered className="settings-modal">
      <Modal.Header closeButton>
        <Modal.Title className="settings-title">
          <i className="bi bi-gear-fill me-2"></i>
          Settings
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="settings-section">
          <h6 className="settings-section-title">Appearance</h6>
          <div className="theme-toggle-row">
            <div className="theme-toggle-label">
              <strong>Theme mode</strong>
              <span className="theme-toggle-hint">Switch between light and dark appearance.</span>
            </div>
            <div className="theme-segmented">
              <button
                type="button"
                className={theme === 'light' ? 'active' : ''}
                onClick={() => setTheme('light')}
              >
                <i className="bi bi-sun-fill"></i>
                Light
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'active' : ''}
                onClick={() => setTheme('dark')}
              >
                <i className="bi bi-moon-stars-fill"></i>
                Dark
              </button>
            </div>
          </div>

          <div className="accent-block">
            <div className="theme-toggle-label">
              <strong>Accent color</strong>
              <span className="theme-toggle-hint">Used for buttons, links, and highlights.</span>
            </div>
            <div className="accent-swatches">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`accent-swatch ${accent === opt.value ? 'active' : ''}`}
                  style={{ '--swatch': opt.color }}
                  onClick={() => setAccent(opt.value)}
                  title={opt.label}
                  aria-label={opt.label}
                >
                  {accent === opt.value && <i className="bi bi-check-lg"></i>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h6 className="settings-section-title">Session</h6>
          <Button variant="outline-danger" className="w-100" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default SettingsModal