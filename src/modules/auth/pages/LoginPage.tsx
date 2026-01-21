import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLogin } from '@/modules/auth/hooks/useAuth'
import { getErrorMessage } from '@/core/api/errors'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'
import { PATHS } from '@/app/router/paths'

export function LoginPage() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const loginMutation = useLogin()

  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const returnTo = searchParams.get('returnTo') || '/dashboard'

  // Helper function to detect if input is email or phone
  const isEmail = (value: string): boolean => {
    return value.includes('@')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Password is required')
      return
    }

    if (!emailOrPhone.trim()) {
      setError('Email or phone number is required')
      return
    }

    try {
      const isEmailInput = isEmail(emailOrPhone)
      await loginMutation.mutateAsync({
        email: isEmailInput ? emailOrPhone : undefined,
        phone: isEmailInput ? undefined : emailOrPhone,
        password,
      })
      nav(returnTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Animation */}
          <div className="order-2 md:order-1">
            <div className="text-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-text mb-2">Electric Vehicle</h2>
              <p className="text-muted text-xs md:text-sm">
                Powering the future of sustainable transportation
              </p>
            </div>
            <div className="scale-75 md:scale-100 origin-center">
              <EVChargingAnimation />
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full max-w-md mx-auto order-1 md:order-2">
            {/* Login Form Card */}
            <div className="bg-panel border border-border-light rounded-2xl p-8 shadow-lg backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input Fields */}
                <div className="space-y-5">
                  <div>
                    <label htmlFor="emailOrPhone" className="block text-xs font-medium text-text-secondary mb-2">
                      Email or Phone Number
                    </label>
                    <input
                      id="emailOrPhone"
                      type="text"
                      className="w-full bg-bg-secondary border border-border-light text-text rounded-xl py-3 px-4 text-sm transition-all duration-200 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="your@email.com or +1234567890"
                      required
                      disabled={loginMutation.isPending}
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-medium text-text-secondary mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="w-full bg-bg-secondary border border-border-light text-text rounded-xl py-3 px-4 pr-12 text-sm transition-all duration-200 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={loginMutation.isPending}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-accent border border-accent text-white py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:bg-accent-hover hover:border-accent-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Logging in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>

                {/* Forgot Password Link */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="text-muted text-xs hover:text-text transition-colors"
                    onClick={() => {
                      nav(PATHS.AUTH.FORGOT_PASSWORD)
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
