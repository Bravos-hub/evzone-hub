import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { authService } from '@/modules/auth/services/authService'

export function InvitationAcceptPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('Validating invitation...')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('Invitation token is missing')
      return
    }

    let isMounted = true
    authService
      .acceptInvitation(token)
      .then((response) => {
        if (!isMounted) return

        setMessage(`Invitation confirmed for ${response.organizationName}. Redirecting to sign in...`)
        const loginUrl = `${PATHS.AUTH.LOGIN}?email=${encodeURIComponent(response.email)}&inviteToken=${encodeURIComponent(response.inviteToken)}`
        navigate(loginUrl, { replace: true })
      })
      .catch((err: any) => {
        if (!isMounted) return
        setError(err?.message || 'Invitation link is invalid or expired')
      })

    return () => {
      isMounted = false
    }
  }, [navigate, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="w-full max-w-md rounded-2xl border border-danger/30 bg-panel p-6 text-center">
          <h1 className="text-xl font-semibold text-danger">Invitation Error</h1>
          <p className="mt-3 text-sm text-text-secondary">{error}</p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white"
            onClick={() => navigate(PATHS.AUTH.LOGIN, { replace: true })}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 text-center">
        <h1 className="text-xl font-semibold text-text">Accepting Invitation</h1>
        <p className="mt-3 text-sm text-text-secondary">{message}</p>
      </div>
    </div>
  )
}
