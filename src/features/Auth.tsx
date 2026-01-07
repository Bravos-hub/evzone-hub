import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'

/* ─────────────────────────────────────────────────────────────────────────────
   Auth Pages — Login, Register, Reset Password, Verify Email
───────────────────────────────────────────────────────────────────────────── */

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const returnTo = searchParams.get('returnTo') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate(returnTo)
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent mb-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-subtle mt-1">Sign in to your EVzone account</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-surface border border-border p-6 space-y-4">
          {error && <div className="rounded-lg bg-rose-50 text-rose-700 px-4 py-2 text-sm">{error}</div>}
          
          <label className="grid gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="text-accent hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-subtle mt-4">
          Don't have an account? <a href="/onboarding" className="text-accent hover:underline">Get started</a>
        </p>
      </div>
    </div>
  )
}

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    // In real app, call API to register
    navigate('/verify-email?email=' + encodeURIComponent(form.email))
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent mb-4">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-subtle mt-1">Join EVzone today</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-surface border border-border p-6 space-y-4">
          {error && <div className="rounded-lg bg-rose-50 text-rose-700 px-4 py-2 text-sm">{error}</div>}
          
          <label className="grid gap-1">
            <span className="text-sm font-medium">Full Name</span>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="input"
              required
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Confirm Password</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="input"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-subtle mt-4">
          Already have an account? <a href="/login" className="text-accent hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-subtle mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <a href="/login" className="text-accent hover:underline">Back to sign in</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Forgot password?</h1>
          <p className="text-subtle mt-1">Enter your email and we'll send you a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-surface border border-border p-6 space-y-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-subtle mt-4">
          <a href="/login" className="text-accent hover:underline">Back to sign in</a>
        </p>
      </div>
    </div>
  )
}

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Verify your email</h2>
        <p className="text-subtle mb-6">
          We've sent a verification email to <strong>{email}</strong>. Please click the link in the email to verify your account.
        </p>
        <div className="space-y-3">
          <button className="w-full px-4 py-2 rounded-lg border border-border hover:bg-muted">
            Resend verification email
          </button>
          <a href="/login" className="block text-accent hover:underline">Back to sign in</a>
        </div>
      </div>
    </div>
  )
}

export default Login

