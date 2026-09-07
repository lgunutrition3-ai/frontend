import React, { createContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    return handleLogin(() => authApi.login(credentials))
  }

  const superadminLogin = async (credentials) => {
    return handleLogin(() => authApi.superadminLogin(credentials))
  }

  const handleLogin = async (request) => {
    try {
      const data = await request()
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        barangay: data.barangay,
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      return { success: true, data }
    } catch (error) {
      // Just return the error, don't set any state here
      const status = error.response?.status
      const retryAfter = error.response?.data?.retryAfter
      const message = error.response?.data?.message || error.message || 'Login failed'
      
      let errorMessage = message
      if (status === 401) {
        errorMessage = 'Invalid username or password. Please try again.'
      } else if (status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.'
      }
      
      return { 
        success: false, 
        error: errorMessage,
        status: status || 500,
        retryAfter: retryAfter || (status === 429 ? 300 : null)
      }
    }
  }

  const register = async (userData) => {
    try {
      const data = await authApi.register(userData)
      return { success: true, data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = {
    user,
    loading,
    login,
    superadminLogin,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isStaff: user?.role === 'staff',
    isSuperAdmin: user?.role === 'superadmin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}