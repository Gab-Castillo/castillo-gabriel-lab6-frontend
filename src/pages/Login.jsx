import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { errorMessage, fieldErrors } from '../api.js'
import AuthLayout from '../components/AuthLayout.jsx'
import { Banner, Button, PasswordField, Spinner, TextField, WAKING_UP, useSlowNotice } from '../components/ui.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const slow = useSlowNotice(busy)
  const notice = location.state?.message

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(identity.trim(), password)
      navigate('/products', { replace: true })
    } catch (err) {
      setError(fieldErrors(err).login || errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your email or username."
      footer={<>New to StokPile? <Link className="font-semibold text-accent-text underline" to="/register">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {notice && <Banner kind="info">{notice}</Banner>}
        {error && <Banner kind="error">{error}</Banner>}
        <TextField
          label="Email or username"
          autoComplete="username"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          required
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" disabled={busy || !identity || !password}>
          {busy && <Spinner />}
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
        {busy && slow && <p className="text-sm text-muted">{WAKING_UP}</p>}
      </form>
    </AuthLayout>
  )
}
