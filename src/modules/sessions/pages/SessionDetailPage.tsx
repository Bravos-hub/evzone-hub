import { useParams, Link, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useSession } from '@/core/api/hooks/useSessions'
import { useStopSession } from '@/core/api/hooks/useSessions'
import { PATHS } from '@/app/router/paths'
import { getErrorMessage } from '@/core/api/errors'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useState } from 'react'

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'sessions')

  const { data: session, isLoading, error } = useSession(id || '')
  const stopSessionMutation = useStopSession()
  const [stopping, setStopping] = useState(false)

  const handleStopSession = async () => {
    if (!id || !window.confirm('Are you sure you want to stop this session?')) return
    setStopping(true)
    try {
      await stopSessionMutation.mutateAsync({ id, reason: 'Manually stopped by admin' })
      alert('Session stopped successfully')
    } catch (err) {
      alert(`Failed to stop session: ${getErrorMessage(err)}`)
    } finally {
      setStopping(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Session Details">
        <div className="card">
          <div className="text-center py-8 text-muted">Loading session...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !session) {
    return (
      <DashboardLayout pageTitle="Session Details">
        <div className="card bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {error ? getErrorMessage(error) : 'Session not found'}
          </div>
          <Link to={PATHS.SESSIONS} className="btn secondary mt-4">
            Back to Sessions
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const startDate = new Date(session.startedAt)
  const endDate = session.endedAt ? new Date(session.endedAt) : null
  const duration = endDate 
    ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) 
    : Math.round((Date.now() - startDate.getTime()) / 60000)

  return (
    <DashboardLayout pageTitle="Session Details">
      <div className="mb-6">
        <Link to={PATHS.SESSIONS} className="text-sm text-subtle hover:text-text mb-2 inline-block">
          ← Back to Sessions
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Session {session.id}</h1>
            <p className="text-muted">
              {startDate.toLocaleString()}
              {endDate && ` - ${endDate.toLocaleString()}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`pill ${
              session.status === 'COMPLETED' ? 'approved' :
              session.status === 'ACTIVE' ? 'active' :
              'rejected'
            }`}>
              {session.status}
            </span>
            {perms.stopSession && session.status === 'ACTIVE' && (
              <button
                className="btn danger"
                onClick={handleStopSession}
                disabled={stopping || stopSessionMutation.isPending}
              >
                {stopping || stopSessionMutation.isPending ? 'Stopping...' : 'Stop Session'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="text-xs text-muted mb-1">Energy Delivered</div>
          <div className="text-xl font-bold">{session.energyDelivered?.toFixed(2) || '0.00'} kWh</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Cost</div>
          <div className="text-xl font-bold">${session.cost?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Duration</div>
          <div className="text-xl font-bold">{duration} min</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted mb-1">Status</div>
          <div className="text-xl font-bold">
            <span className={`pill ${
              session.status === 'COMPLETED' ? 'approved' :
              session.status === 'ACTIVE' ? 'active' :
              'rejected'
            }`}>
              {session.status}
            </span>
          </div>
        </div>
      </div>

      {/* Session Information */}
      <div className="card mb-4">
        <h2 className="text-xl font-bold mb-4">Session Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted mb-1">Session ID</div>
            <div className="font-semibold font-mono">{session.id}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Station ID</div>
            <div className="font-semibold">{session.stationId}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Connector ID</div>
            <div className="font-semibold">{session.connectorId || 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">User ID</div>
            <div className="font-semibold">{session.userId}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Start Time</div>
            <div className="font-semibold text-sm">{startDate.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">End Time</div>
            <div className="font-semibold text-sm">{endDate ? endDate.toLocaleString() : 'Active'}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Energy (kWh)</div>
            <div className="font-semibold">{session.energyDelivered?.toFixed(2) || '0.00'}</div>
          </div>
          <div>
            <div className="text-xs text-muted mb-1">Cost</div>
            <div className="font-semibold">${session.cost?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {perms.stopSession && session.status === 'ACTIVE' && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Actions</h2>
          <button
            className="btn danger"
            onClick={handleStopSession}
            disabled={stopping || stopSessionMutation.isPending}
          >
            {stopping || stopSessionMutation.isPending ? 'Stopping...' : 'Stop Session'}
          </button>
        </div>
      )}
    </DashboardLayout>
  )
}
