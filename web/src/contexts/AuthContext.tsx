import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

interface AuthState {
  isAuthenticated: boolean
  isConfigured: boolean
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: (password: string) => Promise<void>
  setup: (password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isConfigured: false,
    loading: true,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data } = await axios.get('/api/auth/status')
      const hasToken = !!localStorage.getItem('access_token')
      setState({
        isAuthenticated: data.configured && hasToken,
        isConfigured: data.configured,
        loading: false,
      })
    } catch {
      setState({ isAuthenticated: false, isConfigured: false, loading: false })
    }
  }

  const login = async (password: string) => {
    const { data } = await axios.post('/api/auth/login', { password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setState((s) => ({ ...s, isAuthenticated: true }))
  }

  const setup = async (password: string) => {
    const { data } = await axios.post('/api/auth/setup', { password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setState({ isAuthenticated: true, isConfigured: true, loading: false })
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setState((s) => ({ ...s, isAuthenticated: false }))
  }

  return (
    <AuthContext.Provider value={{ ...state, login, setup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
