import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Navbar as BsNavbar, Nav, Container, Button } from 'react-bootstrap'
import nutritionLogo from '../../assets/nutritionlogo.jpg'
import SettingsModal from './SettingsModal'
import './css/Navbar.css'

const Navbar = () => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)



  if (!user) return null

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path)

  return (
    <BsNavbar expand="lg" sticky="top" className="app-navbar shadow-sm" variant="dark">
      <Container>
        <BsNavbar.Brand as={Link} to={isSuperAdmin ? '/superadmin' : '/dashboard'} className="brand-mark">
          <span className="brand-icon">
            <img src={nutritionLogo} alt="Nutrition Logo" />
          </span>
          <span className="brand-text d-none d-sm-inline">
            Nutrition Management
            <span className="brand-sub">Municipal Nutrition Council</span>
          </span>
        </BsNavbar.Brand>

        <Nav className="me-auto nav-links-row">
            <Nav.Link as={Link} to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/barangay-report" className={isActive('/barangay-report') ? 'active' : ''}>
                  Barangay Report
                </Nav.Link>
            {!isAdmin && (
              <Nav.Link as={Link} to="/staff/child-records" className={location.pathname.startsWith('/staff') ? 'active' : ''}>
                Data Entry
              </Nav.Link>
            )}
            {isAdmin && (
              <>
                {isSuperAdmin && (
                  <Nav.Link as={Link} to="/superadmin" className={isActive('/superadmin') ? 'active' : ''}>
                    Admin Management
                  </Nav.Link>
                )}
                <Nav.Link as={Link} to="/overall-report" className={isActive('/overall-report') ? 'active' : ''}>
                  Overall Report
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/records" className={isActive('/admin/records') ? 'active' : ''}>
                  All Records
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/staff" className={isActive('/admin/staff') ? 'active' : ''}>
                  Staff Management
                </Nav.Link>
              </>
            )}
          </Nav>

          <div className="user-chip">
            <span className={`badge role-badge ${isSuperAdmin ? 'role-superadmin' : isAdmin ? 'role-admin' : 'role-staff'}`}>
              {user.role === 'superadmin' ? 'Super Admin' : user.role}
            </span>
            <span className="username-text">{user.username}</span>
            <Button
              variant="outline-light"
              size="sm"
              className="settings-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
            >
              <i className="bi bi-gear-fill"></i>
            </Button>
          </div>
      </Container>
      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
    </BsNavbar>
  )
}

export default Navbar