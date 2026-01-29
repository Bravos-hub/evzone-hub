import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { PATHS } from '@/app/router/paths'
import { authService } from '@/modules/auth/services/authService'
import { onboardingService } from '@/modules/auth/services/onboardingService'

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

const PLANS = [
  {
    id: 'Starter',
    name: 'Starter',
    price: 'UGX 0',
    description: 'Kick-off with a single site',
    features: ['Billing (Time)', 'Basic Reports', 'Email support']
  },
  {
    id: 'Growth',
    name: 'Growth',
    price: 'UGX 120,000',
    description: 'Scale with smart billing',
    features: ['Billing (Time & kWh)', 'TOU Bands', 'Other Taxes/Fees', 'Priority support'],
    popular: true
  },
  {
    id: 'Pro',
    name: 'Pro',
    price: 'UGX 265,000',
    description: 'Roaming & advanced analytics',
    features: ['OCPI Roaming', '4-way Settlement', 'Advanced Analytics', 'Phone support']
  },
  {
    id: 'Enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'Custom SLA & dedicated success',
    features: ['Custom SLA', 'Dedicated Success', 'Private APIs', 'Contact sales']
  }
]

export function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [accountType, setAccountType] = useState<'COMPANY' | 'INDIVIDUAL'>('COMPANY')
  const [role, setRole] = useState<'OWNER' | 'STATION_OPERATOR' | 'SITE_OWNER' | 'TECHNICIAN_ORG'>('OWNER')
  const [capability, setCapability] = useState<'CHARGE' | 'SWAP' | 'BOTH'>('BOTH')
  const [plan, setPlan] = useState('Starter')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    taxId: '',
    country: 'Uganda', // Pre-filled (Geo-detection mock)
    region: 'Central Region',
    payoutProvider: 'MTN',
    walletNumber: '',
    terms: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await authService.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: role === 'OWNER' ? 'STATION_OWNER' : role,
        country: form.country,
        region: form.region,
        subscribedPackage: plan,
        accountType: accountType,
        companyName: accountType === 'COMPANY' ? form.companyName : (form.companyName || form.name),
        ownerCapability: (role === 'OWNER' || role === 'STATION_OPERATOR') ? capability : undefined,
      })

      const resData = (response as any).user || response;
      if (resData.organizationId) {
        setOrgId(resData.organizationId)
      }

      setStep(2)
      // We could store the organizationId from response here if needed
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!orgId) {
      setStep(1)
      return
    }

    setLoading(true)
    try {
      // Step 2: Update Business Profile
      await onboardingService.setupPayouts(orgId, {
        provider: form.payoutProvider,
        walletNumber: form.walletNumber,
        taxId: form.taxId
      })

      if (role === 'SITE_OWNER' || plan === 'Starter') {
        navigate(`${PATHS.AUTH.VERIFY_EMAIL}?email=${encodeURIComponent(form.email)}`)
      } else {
        setStep(3)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update business profile')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    setLoading(true)
    try {
      // Step 3: Activation (Mock payment for now)
      await onboardingService.activate(orgId!, { method: 'MOMO', plan })
      navigate(`${PATHS.AUTH.VERIFY_EMAIL}?email=${encodeURIComponent(form.email)}`)
    } catch (err: any) {
      setError(err?.message || 'Activation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-bg-subtle via-bg-secondary to-bg selection:bg-accent/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .register-shell {
          --evz-ink: var(--app-text);
          --evz-muted: var(--app-text-secondary);
          --evz-accent: var(--app-accent);
          --evz-card: var(--app-panel);
          --evz-card-border: var(--app-border);
          font-family: 'Space Grotesk', sans-serif;
          color: var(--evz-ink);
        }
        .step-title { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
      `}</style>

      <div className="register-shell relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8">
        {/* Progress Stepper */}
        <div className="mb-12 flex items-center justify-center gap-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${step === s ? 'bg-accent text-white ring-4 ring-accent/20' :
                step > s ? 'bg-emerald-500 text-white' : 'bg-panel-2 text-text-secondary border border-border'
                }`}>
                {step > s ? '✓' : s}
              </div>
              <div className={`h-1 w-12 rounded-full hidden sm:block ${step > s ? 'bg-emerald-500' : 'bg-panel-2'}`} />
            </div>
          ))}
        </div>

        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-accent">
              Phase {step}: {step === 1 ? 'Identity' : step === 2 ? 'Business Profile' : 'Activation'}
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <h1 className="step-title text-4xl font-semibold lg:text-5xl">Launch your <span className="text-accent underline decoration-accent/30">EV Business</span> today.</h1>
                <p className="text-text-secondary">Join Africa's leading charging network. Set up in minutes, scale to thousands of stations.</p>
                <div className="grid gap-4 sm:grid-cols-2 mt-8">
                  <div className="p-4 rounded-2xl bg-panel border border-border shadow-sm">
                    <div className="text-accent font-bold mb-1">99.9% Uptime</div>
                    <div className="text-xs text-text-secondary">Enterprise-grade reliability for your site.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-panel border border-border shadow-sm">
                    <div className="text-accent font-bold mb-1">Smart Payouts</div>
                    <div className="text-xs text-text-secondary">Instant settlement via MTN & Airtel.</div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <h1 className="step-title text-4xl font-semibold lg:text-5xl">Verify your <span className="text-emerald-500 underline decoration-emerald-500/30">Business</span>.</h1>
                <p className="text-text-secondary">Provide your KYC details to enable smart payouts and billing compliance.</p>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl text-sm text-emerald-700">
                  <strong>Did you know?</strong> Verified organizations on EVzone get priority OCPI roaming visibility.
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <h1 className="step-title text-4xl font-semibold lg:text-5xl">Finalize & <span className="text-amber-500 underline decoration-amber-500/30">Activate</span>.</h1>
                <p className="text-text-secondary">Complete your first subscription payment to unlock the full dashboard.</p>
                <div className="p-6 rounded-2xl bg-panel border border-border">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-text-secondary mb-4">Your Selected Plan</div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-2xl font-bold">{plan}</div>
                    <div className="text-accent font-bold">{PLANS.find(p => p.id === plan)?.price}/mo</div>
                  </div>
                  <div className="h-px bg-border my-4" />
                  <div className="space-y-2">
                    {PLANS.find(p => p.id === plan)?.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="text-accent">●</span> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="relative">
            <div className="rounded-[32px] border border-border bg-panel p-6 sm:p-8 shadow-card-xl backdrop-blur-sm">
              {error && <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>}

              {/* STEP 1: IDENTITY */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Full Name</span>
                      <input value={form.name} onChange={e => update('name', e.target.value)} className="input rounded-2xl" placeholder="John Doe" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Work Email</span>
                      <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input rounded-2xl" placeholder="john@evco.com" />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Phone</span>
                      <input value={form.phone} onChange={e => update('phone', e.target.value)} className="input rounded-2xl" placeholder="+256..." />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Account Type</span>
                      <div className="flex rounded-xl bg-panel-2 p-1 border border-border">
                        {(['COMPANY', 'INDIVIDUAL'] as const).map(t => (
                          <button key={t} onClick={() => setAccountType(t)} className={`flex-1 rounded-lg py-2 text-[10px] font-bold uppercase tracking-widest transition ${accountType === t ? 'bg-accent text-white shadow-sm' : 'text-text-secondary'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Select Your Role</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {roleOptions.map(r => (
                        <button key={r.value} onClick={() => setRole(r.value)} className={`rounded-xl border p-3 text-[10px] font-bold uppercase tracking-widest transition ${role === r.value ? 'border-accent bg-accent/5 text-accent ring-1 ring-accent' : 'border-border text-text-secondary hover:border-accent/30'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Choose a Subscription Plan</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PLANS.map(p => (
                        <button key={p.id} onClick={() => setPlan(p.id)} className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${plan === p.id ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:border-accent/40'}`}>
                          {p.popular && <div className="absolute top-0 right-0 bg-accent text-[8px] font-bold text-white px-2 py-1 rounded-bl-lg uppercase tracking-widest">Popular</div>}
                          <div className="font-bold text-sm">{p.name}</div>
                          <div className="text-xs text-text-secondary mt-1">{p.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Password</span>
                      <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input rounded-2xl" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Confirm</span>
                      <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} className="input rounded-2xl" />
                    </label>
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full rounded-2x bg-accent py-4 font-bold text-white shadow-lg transition hover:bg-accent-hover disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Next: Business details'}
                  </button>
                </div>
              )}

              {/* STEP 2: BUSINESS PROFILE */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-secondary hover:border-accent transition group cursor-pointer bg-panel-2">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                      <span className="text-[10px] mt-1 font-bold">LOGO</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                        {accountType === 'COMPANY' ? 'Company Name' : 'Business Name (Optional)'}
                      </label>
                      <input
                        value={form.companyName}
                        onChange={e => update('companyName', e.target.value)}
                        className="input rounded-xl"
                        placeholder={accountType === 'COMPANY' ? 'Volt Charging Ltd' : form.name}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Country</span>
                      <input value={form.country} onChange={e => update('country', e.target.value)} className="input rounded-xl bg-panel-2" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Region/City</span>
                      <input value={form.region} onChange={e => update('region', e.target.value)} className="input rounded-xl" />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Payout Settings (Receive Revenue)</span>
                    <div className="grid gap-4 border border-border p-4 rounded-2xl bg-panel-2">
                      <div className="flex gap-2">
                        {['MTN', 'Airtel', 'Bank'].map(p => (
                          <button key={p} onClick={() => update('payoutProvider', p)} className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition ${form.payoutProvider === p ? 'bg-white shadow-sm ring-1 ring-border text-accent' : 'text-text-secondary'}`}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <label className="space-y-2">
                        <span className="text-[10px] font-bold uppercase text-text-secondary">Mobile Money / Bank Account Number</span>
                        <input value={form.walletNumber} onChange={e => update('walletNumber', e.target.value)} className="input rounded-xl bg-white" placeholder="+256..." />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">KYC Documents</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border border-border border-dashed rounded-xl text-center text-[10px] font-bold text-text-secondary cursor-pointer hover:border-accent">
                        ID / Passport
                      </div>
                      <div className="p-3 border border-border border-dashed rounded-xl text-center text-[10px] font-bold text-text-secondary cursor-pointer hover:border-accent">
                        Cert. of Inc / Trade License
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-border py-4 font-bold text-text-secondary hover:bg-panel-2 transition">Back</button>
                    <button onClick={handleCompleteOnboarding} className="flex-[2] rounded-xl bg-accent py-4 font-bold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover transition">
                      {role === 'SITE_OWNER' ? 'Complete Setup' : 'Next: Activation'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: BILLING */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-emerald-600 font-bold mb-1">Invoice Generated</div>
                    <div className="text-xs text-emerald-800/70">Ref: INV-{Math.random().toString(36).substring(7).toUpperCase()}</div>
                    <div className="mt-4 text-3xl font-bold">{PLANS.find(p => p.id === plan)?.price}</div>
                    <div className="text-xs font-bold text-text-secondary uppercase mt-1 tracking-widest">Initial Subscription</div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Select Payment Method</span>
                    <div className="space-y-2">
                      {['Mobile Money (Recommended)', 'Visa / MasterCard', 'Wallet Balance'].map((m, i) => (
                        <div key={m} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition ${i === 0 ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border hover:bg-panel-2'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full border-4 ${i === 0 ? 'border-accent' : 'border-border'}`} />
                            <span className="text-sm font-bold">{m}</span>
                          </div>
                          {i === 0 && <span className="text-[10px] font-bold text-accent uppercase">Fast</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-panel-2 border border-border text-[11px] text-text-secondary">
                    By clicking "Activate", a payment prompt will be sent to your registered phone number.
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-border py-4 font-bold text-text-secondary hover:bg-panel-2 transition">Back</button>
                    <button onClick={handleActivate} className="flex-[2] rounded-xl bg-accent py-4 font-bold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover transition">
                      Confirm & Activate
                    </button>
                  </div>
                </div>
              )}
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


