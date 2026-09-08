import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || `http://localhost:5210`

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Auto-add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-handle 401 errors - but NOT for login requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if this is a login request
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    const isSuperAdminLoginRequest = error.config?.url?.includes('/auth/superadmin-login')
    let loginRedirectPath = '/login'
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (isSuperAdminLoginRequest || storedUser?.role === 'superadmin') {
        loginRedirectPath = '/superadmin/login'
      }
    } catch {
      // localStorage corrupted, default to login
    }
    
    // Only redirect on 401 if it's NOT a login request
    if (error.response?.status === 401 && !isLoginRequest && !isSuperAdminLoginRequest) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = loginRedirectPath
    }
    
    return Promise.reject(error)
  }
)

export default api