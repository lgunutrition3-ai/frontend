import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from 'react-bootstrap'

const ProtectedRoute = ({ children, adminOnly = false, staffOnly = false, superadminOnly = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  const isSuperAdmin = user?.role === 'superadmin'
  const isAdmin = user?.role === 'admin' || isSuperAdmin

  if (!user) {
    return <Navigate to={superadminOnly ? '/superadmin/login' : '/login'} replace />
  }

  if (superadminOnly && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (staffOnly && user.role !== 'staff') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute