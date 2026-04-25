import React, { createContext, useContext, useState, useEffect } from 'react'
import { getMe, getStoredToken, logout as apiLogout } from '../api/api'

interface AuthUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

interface AuthProfile {
  id: string
  specialties: string[]
  is_accepting: boolean
}

interface AuthShop {
  id: string
  name: string
  address: string | null
  whatsapp: string | null
}

interface AuthState {
  user: AuthUser | null
  profile: AuthProfile | null
  barbershop: AuthShop | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  setAuth: (data: { user: AuthUser; profile: AuthProfile; barbershop: AuthShop }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    barbershop: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Verifica se já tem token salvo
    async function init() {
      try {
        const token = await getStoredToken()
        if (token) {
          const data = await getMe()
          setState({
            user:          data.user,
            profile:       data.profile,
            barbershop:    data.barbershop,
            isLoading:     false,
            isAuthenticated: true,
          })
        } else {
          setState(s => ({ ...s, isLoading: false }))
        }
      } catch {
        setState(s => ({ ...s, isLoading: false }))
      }
    }
    init()
  }, [])

  function setAuth(data: { user: AuthUser; profile: AuthProfile; barbershop: AuthShop }) {
    setState({
      user:          data.user,
      profile:       data.profile,
      barbershop:    data.barbershop,
      isLoading:     false,
      isAuthenticated: true,
    })
  }

  async function logout() {
    await apiLogout()
    setState({ user: null, profile: null, barbershop: null, isLoading: false, isAuthenticated: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
