import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Products from './pages/Products.jsx'

function ProtectedRoute({ children }) {
  const { user, expired } = useAuth()
  if (!user) {
    const state = expired ? { message: 'Your session ended. Sign in again.' } : undefined
    return <Navigate to="/login" replace state={state} />
  }
  return children
}

function PublicOnly({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/products" replace /> : children
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-3xl">Page not found</h1>
      <p className="text-muted">That address doesn&apos;t exist.</p>
      <Link className="font-semibold text-accent-text underline" to="/">Go to the product list</Link>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
