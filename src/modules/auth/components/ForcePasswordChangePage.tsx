import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { useAuthStore } from '@/core/auth/authStore'
import { userService } from '@/modules/auth/services/userService'

export function ForcePasswordChangePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || PATHS.DASHBOARD

  const { user, refreshUser } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate(PATHS.AUTH.LOGIN, { replace: true })
    }
  }, [navigate, user])

  if (!user) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await userService.changePassword(currentPassword, newPassword)
      await refreshUser()
      const latestUser = useAuthStore.getState().user
      const activeMemberships = (latestUser?.memberships || []).filter((membership) => membership.status === 'ACTIVE')

      if (activeMemberships.length > 1) {
        navigate(`${PATHS.AUTH.SELECT_ORGANIZATION}?returnTo=${encodeURIComponent(returnTo)}`, {
          replace: true,
        })
        return
      }

      navigate(returnTo, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6">
        <h1 className="text-xl font-semibold text-text">Change Temporary Password</h1>
        <p className="mt-2 text-sm text-text-secondary">
          You must set a new password before continuing.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Current Password</label>
            <input
              type="password"
              className="input mt-2 w-full"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">New Password</label>
            <input
              type="password"
              className="input mt-2 w-full"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Confirm New Password</label>
            <input
              type="password"
              className="input mt-2 w-full"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
