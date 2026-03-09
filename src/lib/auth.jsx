import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_URL } from './config'

const AuthContext = createContext(null)

const TOKEN_KEY = 'admin_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const verify = useCallback(async (token) => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(data)
      return true
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
      return false
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      verify(token).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [verify])

  const login = useCallback(async (username, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { username, password })
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Login gagal')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}
