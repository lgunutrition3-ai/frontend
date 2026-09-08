import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import { BARANGAYS } from '../utils/constants'
import { Table, Button, Form, Alert, Modal, Badge, Spinner } from 'react-bootstrap'
import StatCard from '../components/dashboard/StatCard'
import nutritionLogo from '../assets/nutritionlogo.jpg'
import './css/AdminStaff.css'

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'One number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
]

const PasswordStrength = ({ password }) => {
  if (!password) return null
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
  const levels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#198754']
  const idx = Math.min(passed, 4)
  return (
    <div className="password-strength mt-2">
      <div className="d-flex align-items-center gap-2 mb-1">
        <div className="flex-grow-1" style={{ height: '4px', background: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${((idx + 1) / 5) * 100}%`, height: '100%', background: colors[idx], borderRadius: '2px', transition: 'all 0.3s' }} />
        </div>
        <small style={{ color: colors[idx], fontWeight: 600, minWidth: '80px' }}>{levels[idx]}</small>
      </div>
      <div className="d-flex flex-wrap gap-1">
        {PASSWORD_RULES.map((rule, i) => (
          <small key={i} style={{ color: rule.test(password) ? '#198754' : '#6c757d', fontSize: '0.7rem' }}>
            <i className={`bi ${rule.test(password) ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '0.6rem' }} />
            {rule.label}
          </small>
        ))}
      </div>
    </div>
  )
}

const AdminStaff = () => {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    barangay: '',
  })
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    barangay: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await api.get('/admin/staff')
      setStaff(response.data)
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const isPasswordStrong = (password) => {
    return PASSWORD_RULES.every((rule) => rule.test(password))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!isPasswordStrong(formData.password)) {
      setError('Password must include uppercase, lowercase, number, and special character')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/admin/staff', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        barangay: formData.barangay,
      })

      setSuccess('Staff created successfully!')
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        barangay: '',
      })
      setShowModal(false)
      fetchStaff()
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating staff')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (staffMember) => {
    setEditItem(staffMember)
    setEditFormData({
      username: staffMember.username,
      email: staffMember.email,
      barangay: staffMember.barangay,
      newPassword: '',
      confirmNewPassword: '',
    })
    setEditError('')
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditError('')

    if (editFormData.newPassword) {
      if (editFormData.newPassword !== editFormData.confirmNewPassword) {
        setEditError('Passwords do not match')
        return
      }
      if (editFormData.newPassword.length < 8) {
        setEditError('Password must be at least 8 characters')
        return
      }
      if (!isPasswordStrong(editFormData.newPassword)) {
        setEditError('Password must include uppercase, lowercase, number, and special character')
        return
      }
    }

    setEditSubmitting(true)

    try {
      const payload = {
        username: editFormData.username,
        email: editFormData.email,
        barangay: editFormData.barangay,
      }
      if (editFormData.newPassword) {
        payload.newPassword = editFormData.newPassword
      }

      await api.put(`/admin/staff/${editItem.id}`, payload)

      setSuccess('Staff updated successfully!')
      setShowEditModal(false)
      setEditItem(null)
      fetchStaff()
    } catch (error) {
      setEditError(error.response?.data?.message || 'Error updating staff')
    } finally {
      setEditSubmitting(false)
    }
  }

  const toggleStaffStatus = async (id) => {
    try {
      await api.put(`/admin/staff/${id}/toggle`)
      fetchStaff()
    } catch (error) {
      console.error('Error toggling staff:', error)
      alert('Error updating staff status')
    }
  }

  const deleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff?')) return
    try {
      await api.delete(`/admin/staff/${id}`)
      fetchStaff()
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Error deleting staff')
    }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <div className="text-center py-5">Access denied. Admin only.</div>
  }

  const totalActive = staff.filter((s) => s.isActive).length
  const totalInactive = staff.length - totalActive
  const barangaysCovered = new Set(staff.map((s) => s.barangay)).size

  const filteredStaff = staff.filter((s) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (s.username || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.barangay || '').toLowerCase().includes(q)
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
      <div className="admin-staff-header">
        <img className="admin-staff-header-logo" src={nutritionLogo} alt="Nutrition Logo" />
        <div className="admin-staff-header-body">
          <h1 className="admin-staff-title">Staff Management</h1>
          <p className="admin-staff-subtitle mb-0">Manage BNS staff accounts</p>
        </div>
        <div className="ms-auto text-end d-none d-md-block text-white-50" style={{ fontSize: '0.85rem' }}>
          {today}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard title="Total Staff" value={staff.length} color="primary" icon="people-fill" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Active" value={totalActive} color="success" icon="person-check-fill" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Inactive" value={totalInactive} color="danger" icon="person-dash-fill" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Barangays" value={barangaysCovered} color="warning" icon="geo-alt-fill" />
        </div>
      </div>

      <div className="admin-staff-toolbar">
        <div className="admin-staff-search">
          <i className="bi bi-search search-icon"></i>
          <Form.Control
            type="text"
            placeholder="Search by name, email, or barangay…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="success" className="admin-staff-add-btn" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-plus-fill"></i> Add Staff
        </Button>
      </div>

      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <div className="dashboard-table-card">
        <div className="table-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5>
            <i className="bi bi-person-lines-fill me-2 text-success"></i>
            Staff Accounts
          </h5>
          <span className="badge text-bg-light border" style={{ fontWeight: 600 }}>
            {filteredStaff.length} shown
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="success" />
          </div>
        ) : staff.length === 0 ? (
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
            <p className="mb-0 text-muted">No staff created yet</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="row-empty py-5 text-center text-muted">
            No matching staff found for "{search}"
          </div>
        ) : (
          <div className="table-responsive">
            <Table className="dashboard-table mb-0" hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Barangay</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staffMember) => (
                  <tr key={staffMember.id}>
                    <td>
                      <span className="fw-semibold">{staffMember.username}</span>
                    </td>
                    <td>{staffMember.email}</td>
                    <td>{staffMember.barangay}</td>
                    <td>
                      <span className={`badge ${staffMember.isActive ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        <i className={`bi ${staffMember.isActive ? 'bi-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '0.6rem' }}></i>
                        {staffMember.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(staffMember)}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Edit
                      </Button>
                      <Button
                        variant={staffMember.isActive ? 'outline-warning' : 'outline-success'}
                        size="sm"
                        className="me-2"
                        onClick={() => toggleStaffStatus(staffMember.id)}
                      >
                        <i className={`bi ${staffMember.isActive ? 'bi-pause-circle' : 'bi-play-circle'} me-1`}></i>
                        {staffMember.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => deleteStaff(staffMember.id)}
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
            Create Staff Account
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
                  minLength={8}
                  placeholder="Minimum 8 characters"
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
              <PasswordStrength password={formData.password} />
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

            <Form.Group className="mb-3">
              <Form.Label>Barangay</Form.Label>
              <Form.Select
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                required
              >
                <option value="">Select Barangay</option>
                {BARANGAYS.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </Form.Select>
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
                'Create Staff'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>
            <i className="bi bi-pencil-square me-2 text-primary"></i>
            Edit Staff Account
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editError && <Alert variant="danger" className="mb-3">{editError}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                required
                placeholder="Enter username"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
                placeholder="Enter email address"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Barangay</Form.Label>
              <Form.Select
                value={editFormData.barangay}
                onChange={(e) => setEditFormData({ ...editFormData, barangay: e.target.value })}
                required
              >
                <option value="">Select Barangay</option>
                {BARANGAYS.map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <hr className="my-3" />
            <p className="text-muted small mb-3">Leave password fields empty to keep the current password.</p>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showEditPassword ? 'text' : 'password'}
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                  placeholder="Leave empty to keep current"
                />
                <Button
                  variant="link"
                  className="password-toggle-btn"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  tabIndex="-1"
                >
                  {showEditPassword ? (
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
              {editFormData.newPassword && <PasswordStrength password={editFormData.newPassword} />}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showEditConfirmPassword ? 'text' : 'password'}
                  value={editFormData.confirmNewPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, confirmNewPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
                <Button
                  variant="link"
                  className="password-toggle-btn"
                  onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                  tabIndex="-1"
                >
                  {showEditConfirmPassword ? (
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
            <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={editSubmitting}>
              {editSubmitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminStaff