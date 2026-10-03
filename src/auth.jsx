import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearSession, getRefreshToken, getStoredUser, saveSession } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [expired, setExpired] = useState(false)

  // The API layer fires this when the refresh token is refused.
  useEffect(() => {
    const onExpired = () => { setUser(null); setExpired(true) }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (login, password) => {
    const res = await api.post('/auth/login', { login, password })
    saveSession(res.data.data)
    setExpired(false)
    setUser(res.data.data.user)
  }, [])

  const register = useCallback(async (username, email, password) => {
    await api.post('/auth/register', { username, email, password })
  }, [])

  const logout = useCallback(async () => {
    const refresh_token = getRefreshToken()
    try {
      if (refresh_token) await api.post('/auth/logout', { refresh_token })
    } catch { /* the local session is cleared either way */ }
    clearSession()
    setExpired(false)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, expired, login, register, logout }),
    [user, expired, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
