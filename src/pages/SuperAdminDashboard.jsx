import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { superAdminApi } from '../api/auth'
import { Table, Button, Form, Alert, Modal, Badge, Spinner } from 'react-bootstrap'
import StatCard from '../components/dashboard/StatCard'
import nutritionLogo from '../assets/nutritionlogo.jpg'
import './css/AdminStaff.css'

const SuperAdminDashboard = () => {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const data = await superAdminApi.getAdmins()
      setAdmins(data)
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)

    try {
      await superAdminApi.createAdmin({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })

      setSuccess('Admin created successfully!')
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      })
      setShowModal(false)
      fetchAdmins()
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating admin')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAdminStatus = async (id) => {
    try {
      await superAdminApi.toggleAdmin(id)
      fetchAdmins()
    } catch (error) {
      console.error('Error toggling admin:', error)
      alert('Error updating admin status')
    }
  }

  const deleteAdmin = async (id, username) => {
    if (!confirm(`Are you sure you want to delete the admin account "${username}"?`)) return
    try {
      await superAdminApi.deleteAdmin(id)
      fetchAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Error deleting admin')
    }
  }

  if (!user || user.role !== 'superadmin') {
    return <div className="text-center py-5">Access denied. Super Admin only.</div>
  }

  const totalActive = admins.filter((a) => a.isActive).length
  const totalInactive = admins.length - totalActive

  const filteredAdmins = admins.filter((a) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (a.username || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    )
  })

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="admin-staff-page">
      {/* Header */}
      <div className="admin-staff-header">
        <img className="admin-staff-header-logo" src={nutritionLogo} alt="Nutrition Logo" />
        <div className="admin-staff-header-body">
          <h1 className="admin-staff-title">Admin Management</h1>
          <p className="admin-staff-subtitle mb-0">Create and manage administrator accounts</p>
        </div>
        <div className="ms-auto text-end d-none d-md-block text-white-50" style={{ fontSize: '0.85rem' }}>
          {today}
        </div>
      </div>

      {/* Stat overview */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-4">
          <StatCard title="Total Admins" value={admins.length} color="primary" icon="people-fill" />
        </div>
        <div className="col-6 col-lg-4">
          <StatCard title="Active" value={totalActive} color="success" icon="person-check-fill" />
        </div>
        <div className="col-6 col-lg-4">
          <StatCard title="Inactive" value={totalInactive} color="danger" icon="person-dash-fill" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-staff-toolbar">
        <div className="admin-staff-search">
          <i className="bi bi-search search-icon"></i>
          <Form.Control
            type="text"
            placeholder="Search by username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="success" className="admin-staff-add-btn" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-plus-fill"></i> Add Admin
        </Button>
      </div>

      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {/* Admin table */}
      <div className="dashboard-table-card">
        <div className="table-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5>
            <i className="bi bi-person-lines-fill me-2 text-success"></i>
            Administrator Accounts
          </h5>
          <span className="badge text-bg-light border" style={{ fontWeight: 600 }}>
            {filteredAdmins.length} shown
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-5">
            <img
              src={nutritionLogo}
              alt="Nutrition Logo"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '2px solid #198754',
                marginBottom: '15px',
              }}
            />
            <p className="mb-0 text-muted">No admins created yet</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="row-empty py-5 text-center text-muted">
            No matching admin found for “{search}”
          </div>
        ) : (
          <div className="table-responsive">
            <Table className="dashboard-table mb-0" hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <span className="fw-semibold">{admin.username}</span>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`badge ${admin.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        <i className={`bi ${admin.isActive ? 'bi-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '0.6rem' }}></i>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <Button
                        variant={admin.isActive ? 'outline-warning' : 'outline-success'}
                        size="sm"
                        className="me-2"
                        onClick={() => toggleAdminStatus(admin.id)}
                      >
                        <i className={`bi ${admin.isActive ? 'bi-pause-circle' : 'bi-play-circle'} me-1`}></i>
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => deleteAdmin(admin.id, admin.username)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            <img
              src={nutritionLogo}
              alt="Logo"
              style={{
                width: '30px',
                height: '30px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '1px solid #198754',
                marginRight: '10px',
              }}
            />
            Create Admin Account
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="Enter username"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="Enter email address"
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
                  minLength={6}
                  placeholder="Minimum 6 characters"
                />
                <Button
                  variant="link"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
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

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  placeholder="Confirm password"
                />
                <Button
                  variant="link"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? (
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
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Creating…
                </>
              ) : (
                'Create Admin'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default SuperAdminDashboard