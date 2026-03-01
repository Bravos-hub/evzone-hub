import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import { authService } from '@/modules/auth/services/authService'
import { useAuthStore } from '@/core/auth/authStore'

export function SelectOrganizationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || PATHS.DASHBOARD

  const { user, loginWithResponse } = useAuthStore()
  const [submittingOrgId, setSubmittingOrgId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const memberships = useMemo(
    () => (user?.memberships || []).filter((membership) => membership.status === 'ACTIVE'),
    [user?.memberships],
  )

  useEffect(() => {
    if (!user) {
      navigate(PATHS.AUTH.LOGIN, { replace: true })
      return
    }

    if (memberships.length <= 1) {
      navigate(returnTo, { replace: true })
    }
  }, [memberships.length, navigate, returnTo, user])

  if (!user || memberships.length <= 1) return null

  async function handleSelect(organizationId: string) {
    setError('')
    setSubmittingOrgId(organizationId)

    try {
      const response = await authService.switchOrganization({ organizationId })
      loginWithResponse(response)
      navigate(returnTo, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Failed to switch organization')
    } finally {
      setSubmittingOrgId(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-panel p-6">
        <h1 className="text-2xl font-semibold text-text">Choose Organization</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Your account is linked to multiple organizations. Select one to continue.
        </p>

        <div className="mt-6 space-y-3">
          {memberships.map((membership) => {
            const isActive = membership.organizationId === user.activeOrganizationId
            const isSubmitting = submittingOrgId === membership.organizationId

            return (
              <button
                key={membership.id}
                type="button"
                className="w-full rounded-xl border border-border bg-panel-2 px-4 py-3 text-left hover:border-accent/50"
                disabled={Boolean(submittingOrgId)}
                onClick={() => handleSelect(membership.organizationId)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-text">
                      {membership.organizationName || membership.organizationId}
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">Role: {membership.role}</div>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {isSubmitting ? 'Switching...' : isActive ? 'Current' : 'Select'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {error && <div className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
      </div>
    </div>
  )
}
