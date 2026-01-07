import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSendOtp, useVerifyOtp } from '@/core/api/hooks/useAuth'
import { getErrorMessage } from '@/core/api/errors'
import { PATHS } from '@/app/router/paths'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'

type Step = 'input' | 'otp'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const sendOtpMutation = useSendOtp()
  const verifyOtpMutation = useVerifyOtp()

  const [step, setStep] = useState<Step>('input')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isEmailInput, setIsEmailInput] = useState(false)

  // Helper function to detect if input is email or phone
  const isEmail = (value: string): boolean => {
    return value.includes('@')
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!emailOrPhone.trim()) {
      setError('Email or phone number is required')
      return
    }

    try {
      const emailInput = isEmail(emailOrPhone)
      setIsEmailInput(emailInput)
      await sendOtpMutation.mutateAsync({
        email: emailInput ? emailOrPhone : undefined,
        phone: emailInput ? undefined : emailOrPhone,
        type: 'password_reset',
      })
      setStep('otp')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otp.trim()) {
      setError('OTP is required')
      return
    }

    if (otp.length < 4) {
      setError('OTP must be at least 4 characters')
      return
    }

    try {
      const emailInput = isEmail(emailOrPhone)
      // Verify OTP - for password reset, we just need to verify, not log in
      // The backend should validate the OTP and allow password reset
      await verifyOtpMutation.mutateAsync({
        email: emailInput ? emailOrPhone : undefined,
        phone: emailInput ? undefined : emailOrPhone,
        code: otp,
        type: 'password_reset',
      })
      
      // Store verification info temporarily for password reset
      // Note: We store email/phone + OTP to use for password reset API call
      const resetData = {
        email: emailInput ? emailOrPhone : undefined,
        phone: emailInput ? undefined : emailOrPhone,
        otp: otp,
      }
      sessionStorage.setItem('passwordResetData', JSON.stringify(resetData))
      
      // Clear any auth tokens that might have been set (we don't want to log in yet)
      // The user should reset password first, then log in
      
      // Redirect to password reset page
      navigate(PATHS.AUTH.RESET_PASSWORD, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleBack = () => {
    if (step === 'otp') {
      setStep('input')
      setOtp('')
      setError('')
    } else {
      navigate(PATHS.AUTH.LOGIN, { replace: true })
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setOtp('')
    try {
      const isEmailInput = isEmail(emailOrPhone)
      await sendOtpMutation.mutateAsync({
        email: isEmailInput ? emailOrPhone : undefined,
        phone: isEmailInput ? undefined : emailOrPhone,
        type: 'password_reset',
      })
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
              <h2 className="text-xl md:text-2xl font-bold text-text mb-2">Reset Your Password</h2>
              <p className="text-muted text-xs md:text-sm">
                We'll help you get back into your account
              </p>
            </div>
            <div className="scale-75 md:scale-100 origin-center">
              <EVChargingAnimation />
            </div>
          </div>

          {/* Right side - Form */}
          <div className="w-full max-w-md mx-auto order-1 md:order-2">
            <div className="bg-panel border border-border-light rounded-2xl p-8 shadow-lg backdrop-blur-sm">
              {step === 'input' && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-text mb-2">Forgot password?</h1>
                    <p className="text-muted text-sm">
                      Enter your email or phone number and we'll send you an OTP to reset your password.
                    </p>
                  </div>

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
                      disabled={sendOtpMutation.isPending}
                      autoComplete="username"
                    />
                  </div>

                  {error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-accent border border-accent text-white py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:bg-accent-hover hover:border-accent-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending OTP...
                      </span>
                    ) : (
                      'Send OTP'
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-muted text-xs hover:text-text transition-colors"
                    >
                      Back to sign in
                    </button>
                  </div>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-text mb-2">Enter OTP</h1>
                    <p className="text-muted text-sm">
                      {isEmailInput ? (
                        <>
                          We've sent an OTP and a reset link to <strong className="text-text">{emailOrPhone}</strong>
                          <br />
                          <span className="text-xs mt-2 block">You can use either the OTP or click the reset link in your email.</span>
                        </>
                      ) : (
                        <>
                          We've sent an OTP to <strong className="text-text">{emailOrPhone}</strong>
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="otp" className="block text-xs font-medium text-text-secondary mb-2">
                      OTP Code
                    </label>
                    <input
                      id="otp"
                      type="text"
                      className="w-full bg-bg-secondary border border-border-light text-text rounded-xl py-3 px-4 text-sm transition-all duration-200 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted text-center text-lg tracking-widest"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                      disabled={verifyOtpMutation.isPending}
                      autoComplete="one-time-code"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-accent border border-accent text-white py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:bg-accent-hover hover:border-accent-hover hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    disabled={verifyOtpMutation.isPending}
                  >
                    {verifyOtpMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-muted hover:text-text transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={sendOtpMutation.isPending}
                      className="text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                    >
                      {sendOtpMutation.isPending ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
