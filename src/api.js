import axios from 'axios'

// The address of the LavaLust API. Set VITE_API_URL in .env (local) or in Vercel (live).
export const API_ROOT = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '')

// ---- token storage (localStorage, wrapped so a blocked browser never crashes the app) ----
const KEYS = { access: 'pm_access', refresh: 'pm_refresh', user: 'pm_user' }

function read(key) {
  try { return localStorage.getItem(KEYS[key]) } catch { return null }
}
function write(key, value) {
  try { localStorage.setItem(KEYS[key], value) } catch { /* ignore */ }
}

export function getStoredUser() {
  try { return JSON.parse(read('user')) } catch { return null }
}
export function saveSession({ user, tokens }) {
  write('access', tokens.access_token)
  write('refresh', tokens.refresh_token)
  write('user', JSON.stringify(user))
}
export function clearSession() {
  try { Object.values(KEYS).forEach((k) => localStorage.removeItem(k)) } catch { /* ignore */ }
}
export function getRefreshToken() {
  return read('refresh')
}

// ---- axios instance ----
// The free Render server can take about a minute to wake up, so the timeout is generous.
export const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 70000,
})

api.interceptors.request.use((config) => {
  const token = read('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// One refresh at a time, even when several requests fail together.
let refreshing = null

async function refreshTokens() {
  const refresh = read('refresh')
  if (!refresh) throw Object.assign(new Error('No refresh token'), { response: { status: 401 } })
  const res = await axios.post(
    `${API_ROOT}/api/auth/refresh`,
    { refresh_token: refresh },
    { headers: { 'Content-Type': 'application/json' }, timeout: 70000 },
  )
  const t = res.data.tokens
  write('access', t.access_token)
  write('refresh', t.refresh_token)
  return t.access_token
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthCall = typeof config?.url === 'string' && config.url.startsWith('/auth/')

    if (response?.status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true
      try {
        refreshing = refreshing || refreshTokens().finally(() => { refreshing = null })
        const newAccess = await refreshing
        config.headers.Authorization = `Bearer ${newAccess}`
        return api(config)
      } catch (refreshError) {
        // Only end the session when the server really refused the refresh token.
        if (refreshError?.response) {
          clearSession()
          window.dispatchEvent(new Event('auth:expired'))
        }
      }
    }
    return Promise.reject(error)
  },
)

// ---- helpers for readable errors ----
export function errorMessage(err) {
  if (err?.response) {
    const data = err.response.data
    if (data && typeof data.error === 'string') return data.error
    return `Something went wrong (error ${err.response.status}).`
  }
  if (err?.code === 'ECONNABORTED') return 'The server took too long to answer. Try again.'
  return 'Could not reach the server. Try again.'
}

export function fieldErrors(err) {
  const e = err?.response?.data?.errors
  return e && typeof e === 'object' ? e : {}
}
