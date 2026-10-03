import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { errorMessage, fieldErrors } from '../api.js'
import AuthLayout from '../components/AuthLayout.jsx'
import { Banner, Button, PasswordField, Spinner, TextField, WAKING_UP, useSlowNotice } from '../components/ui.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const slow = useSlowNotice(busy)

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))
  const longEnough = form.password.length >= 8

  function validate() {
    const next = {}
    const username = form.username.trim()
    if (username.length < 3 || username.length > 100) next.username = 'Use 3 to 100 characters.'
    if (username.includes('@')) next.username = 'Usernames cannot contain @.'
    if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!longEnough) next.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) next.confirm = 'The passwords do not match.'
    return next
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try {
      await register(form.username.trim(), form.email.trim(), form.password)
      navigate('/login', { replace: true, state: { message: 'Account created. Sign in to continue.' } })
    } catch (err) {
      const fromApi = fieldErrors(err)
      if (Object.keys(fromApi).length) setErrors(fromApi)
      else setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your StokPile login."
      footer={<>Already registered? <Link className="font-semibold text-accent-text underline" to="/login">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {error && <Banner kind="error">{error}</Banner>}
        <TextField label="Username" autoComplete="username" value={form.username} onChange={set('username')} error={errors.username} />
        <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <div>
          <PasswordField label="Password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} />
          <p className={`mt-1.5 flex items-center gap-1.5 text-sm ${longEnough ? 'text-ok' : 'text-muted'}`}>
            <span aria-hidden="true">{longEnough ? '✓' : '○'}</span> At least 8 characters
          </p>
        </div>
        <PasswordField label="Confirm password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" disabled={busy}>
          {busy && <Spinner />}
          {busy ? 'Creating account…' : 'Create account'}
        </Button>
        {busy && slow && <p className="text-sm text-muted">{WAKING_UP}</p>}
      </form>
    </AuthLayout>
  )
}
