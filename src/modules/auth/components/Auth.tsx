import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/app/router/paths'
import { authService } from '@/core/api/services/authService'

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

  const returnTo = searchParams.get('returnTo') || PATHS.DASHBOARD

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
    <div className="relative h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-br from-bg-subtle via-bg-secondary to-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .login-shell {
          --evz-ink: var(--app-text);
          --evz-muted: var(--app-text-secondary);
          --evz-accent: var(--app-accent);
          --evz-accent-strong: var(--app-accent-hover);
          --evz-card: var(--app-panel);
          --evz-card-border: var(--app-border);
          --evz-card-soft: var(--app-panel-2);
          font-family: 'Space Grotesk', 'Segoe UI', Tahoma, sans-serif;
          color: var(--evz-ink);
        }
        .login-title {
          font-family: 'Fraunces', 'Times New Roman', serif;
          letter-spacing: -0.02em;
        }
      `}</style>

      <div className="pointer-events-none absolute -top-24 right-[-120px] h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[-80px] h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <div className="login-shell relative mx-auto flex min-h-screen w-full max-w-5xl items-start px-4 py-8 sm:py-10 lg:items-center lg:py-16">
        <div className="grid w-full gap-8 lg:gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="order-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--evz-card-border)] bg-[var(--evz-card)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--evz-accent)] shadow-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
              </span>
              Secure sign-in
            </div>

            <div className="space-y-4">
              <h1 className="login-title text-3xl font-semibold text-[var(--evz-ink)] sm:text-4xl lg:text-5xl">
                Welcome back to EVzone
              </h1>
              <p className="max-w-xl text-sm text-[var(--evz-muted)] sm:text-base">
                Monitor live stations, review battery health, and keep your operations aligned with a single unified dashboard.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Stations covered', value: '240+' },
                { label: 'Response time', value: '24/7' },
                { label: 'Operational uptime', value: '99.9%' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-secondary">{stat.label}</div>
                  <div className="mt-4 text-xl font-semibold text-[var(--evz-ink)] sm:text-2xl">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-panel p-5 text-sm text-[var(--evz-muted)]">
              Keep your stations synced with real-time alerts, swap analytics, and technician dispatch updates.
            </div>
          </section>

          <section className="order-1 relative animate-in fade-in slide-in-from-right-4 duration-700 lg:order-2">
            <div className="rounded-[28px] border border-[var(--evz-card-border)] bg-[var(--evz-card)] p-5 sm:p-6 shadow-card backdrop-blur">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-semibold">Sign in</h2>
                <p className="text-sm text-[var(--evz-muted)]">Use your EVzone credentials to continue.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="rounded-lg border border-danger/30 bg-danger/10 text-danger px-4 py-2 text-sm">{error}</div>}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input mt-2 rounded-2xl"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input mt-2 rounded-2xl"
                    placeholder="password"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-[var(--evz-muted)]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-border" />
                    <span>Remember me</span>
                  </label>
                  <a href={PATHS.AUTH.FORGOT_PASSWORD} className="text-accent hover:underline">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-hover disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-[var(--evz-muted)]">
                Don't have an account? <a href={PATHS.AUTH.REGISTER} className="text-accent hover:underline">Get started</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export function Register() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState<'COMPANY' | 'INDIVIDUAL'>('COMPANY')
  const [role, setRole] = useState<'OWNER' | 'STATION_OPERATOR' | 'SITE_OWNER' | 'TECHNICIAN_ORG'>('OWNER')
  const [capability, setCapability] = useState<'CHARGE' | 'SWAP' | 'BOTH'>('BOTH')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    companyName: '',
    companyReg: '',
    taxId: '',
    name: '',
    jobTitle: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k: keyof typeof form, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v }))
  }

  const needsCapability = role === 'OWNER' || role === 'STATION_OPERATOR'
  const isCompany = accountType === 'COMPANY'

  const roleOptions = [
    { label: 'Station Owner', value: 'OWNER' as const },
    { label: 'Operator', value: 'STATION_OPERATOR' as const },
    { label: 'Technician', value: 'TECHNICIAN_ORG' as const },
    { label: 'Site Owner', value: 'SITE_OWNER' as const },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const missing: string[] = []
    if (isCompany && !form.companyName.trim()) missing.push('Company name')
    if (!form.name.trim()) missing.push('Full name')
    if (!form.email.trim()) missing.push('Email')
    if (!form.phone.trim()) missing.push('Phone')
    if (!form.password) missing.push('Password')
    if (!form.confirmPassword) missing.push('Confirm password')

    if (missing.length > 0) {
      setError(`Please complete: ${missing.join(', ')}.`)
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!form.terms) {
      setError('Please accept the terms to continue')
      return
    }

    setLoading(true)
    setLoading(true)
    try {
      await authService.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: role,
        // capability, accountType, etc. mapped execution
        ownerCapability: needsCapability ? capability : undefined,
      })
      navigate(`${PATHS.AUTH.VERIFY_EMAIL}?email=${encodeURIComponent(form.email)}`)
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-br from-bg-subtle via-bg-secondary to-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .register-shell {
          --evz-ink: var(--app-text);
          --evz-muted: var(--app-text-secondary);
          --evz-accent: var(--app-accent);
          --evz-accent-strong: var(--app-accent-hover);
          --evz-card: var(--app-panel);
          --evz-card-border: var(--app-border);
          --evz-card-soft: var(--app-panel-2);
          font-family: 'Space Grotesk', 'Segoe UI', Tahoma, sans-serif;
          color: var(--evz-ink);
        }
        .register-title {
          font-family: 'Fraunces', 'Times New Roman', serif;
          letter-spacing: -0.02em;
        }
      `}</style>

      <div className="pointer-events-none absolute -top-24 right-[-120px] h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[-80px] h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

      <div className="register-shell relative mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-8 sm:py-10 lg:items-center lg:py-16">
        <div className="grid w-full gap-8 lg:gap-10 lg:grid-cols-[1.05fr_1fr]">
          <section className="order-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--evz-card-border)] bg-[var(--evz-card)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--evz-accent)] shadow-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
              </span>
              Premium onboarding
            </div>

            <div className="space-y-4">
              <h1 className="register-title text-3xl font-semibold text-[var(--evz-ink)] sm:text-4xl lg:text-5xl">
                Create your EVzone account and launch in minutes
              </h1>
              <p className="max-w-xl text-sm text-[var(--evz-muted)] sm:text-base">
                Bring owners, operators, technicians, and site teams together on one reliable platform designed for full-width EV ecosystems.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Account, all roles', value: '1' },
                { label: 'Average setup', value: '5 min' },
                { label: 'Security ready', value: 'ISO 27001' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-text-secondary">{stat.label}</div>
                  <div className="mt-4 text-xl font-semibold text-[var(--evz-ink)] sm:text-2xl">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-panel p-5 text-sm text-[var(--evz-muted)]">
              Need help onboarding your fleet or sites? Our team can configure your workspace and data model in under 24 hours.
            </div>
          </section>

          <section className="order-1 relative animate-in fade-in slide-in-from-right-4 duration-700 lg:order-2">
            <div className="rounded-[28px] border border-[var(--evz-card-border)] bg-[var(--evz-card)] p-5 sm:p-6 shadow-card backdrop-blur">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="rounded-lg border border-danger/30 bg-danger/10 text-danger px-4 py-2 text-sm">{error}</div>}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Full name</label>
                  <input
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    className="input mt-2 rounded-2xl"
                    placeholder="Jane Doe"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Work email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    className="input mt-2 rounded-2xl"
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="rounded-full border border-border bg-panel p-1">
                    {(['COMPANY', 'INDIVIDUAL'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAccountType(type)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition ${accountType === type
                          ? 'bg-accent text-white shadow-sm'
                          : 'text-text-secondary hover:text-text'
                          }`}
                      >
                        {type === 'COMPANY' ? 'Company' : 'Individual'}
                      </button>
                    ))}
                  </div>

                  {needsCapability && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                      <span className="uppercase tracking-[0.2em]">Capability</span>
                      <select
                        value={capability}
                        onChange={e => setCapability(e.target.value as typeof capability)}
                        className="select h-9 rounded-full text-xs font-semibold"
                      >
                        <option value="CHARGE">Charge</option>
                        <option value="SWAP">Swap</option>
                        <option value="BOTH">Both</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Choose your workspace roles</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setRole(option.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${role === option.value
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-panel text-text-secondary hover:border-accent/40'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isCompany && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Company name</span>
                      <input
                        value={form.companyName}
                        onChange={e => update('companyName', e.target.value)}
                        className="input rounded-2xl"
                        placeholder="VoltOps Ltd"
                        required
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Registration ID</span>
                      <input
                        value={form.companyReg}
                        onChange={e => update('companyReg', e.target.value)}
                        className="input rounded-2xl"
                        placeholder="Optional"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Tax ID</span>
                      <input
                        value={form.taxId}
                        onChange={e => update('taxId', e.target.value)}
                        className="input rounded-2xl"
                        placeholder="Optional"
                      />
                    </label>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Phone</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      className="input rounded-2xl"
                      placeholder="+256 700 000000"
                      required
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Job title</span>
                    <input
                      value={form.jobTitle}
                      onChange={e => update('jobTitle', e.target.value)}
                      className="input rounded-2xl"
                      placeholder="Operations lead"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Password</span>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => update('password', e.target.value)}
                        className="input rounded-2xl pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-panel p-2 text-accent"
                        aria-label="Toggle password visibility"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">Confirm password</span>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => update('confirmPassword', e.target.value)}
                        className="input rounded-2xl pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-panel p-2 text-accent"
                        aria-label="Toggle confirm password visibility"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </label>
                </div>

                <div className="text-xs text-[var(--evz-muted)]">Use 8 or more characters with a mix of letters and numbers.</div>

                <label className="flex items-start gap-3 text-sm text-[var(--evz-muted)]">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={e => update('terms', e.target.checked)}
                    className="checkbox mt-1"
                  />
                  I agree to the Terms of Service and Privacy Policy.
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-accent transition hover:bg-accent-hover disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <p className="text-center text-sm text-[var(--evz-muted)]">
                  Already have an account? <a href={PATHS.AUTH.LOGIN} className="text-accent hover:underline">Sign in</a>
                </p>
              </form>
            </div>
          </section>
        </div>
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
          <a href={PATHS.AUTH.LOGIN} className="text-accent hover:underline">Back to sign in</a>
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
          <a href={PATHS.AUTH.LOGIN} className="text-accent hover:underline">Back to sign in</a>
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
          <a href={PATHS.AUTH.LOGIN} className="block text-accent hover:underline">Back to sign in</a>
        </div>
      </div>
    </div>
  )
}

export default Login


