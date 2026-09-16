import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, loginRequest, logoutRequest } from '../services/authApi'
import { hasPermission, type AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string, keepSignedIn?: boolean) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  can: (module: string, action: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const currentUser = await fetchCurrentUser()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const currentUser = await fetchCurrentUser()
        if (active) {
          setUser(currentUser)
        }
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string, keepSignedIn = false) => {
      const authenticatedUser = await loginRequest(email, password, keepSignedIn)
      setUser(authenticatedUser)
      return authenticatedUser
    },
    [],
  )

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const can = useCallback(
    (module: string, action: string) => hasPermission(user, module, action),
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
      can,
    }),
    [user, loading, login, logout, refresh, can],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
