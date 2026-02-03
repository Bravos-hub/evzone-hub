import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useSystemHealth, useSystemEvents, useRestartService } from '@/modules/analytics/hooks/useAnalytics'
import { getErrorMessage } from '@/core/api/errors'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import { ServiceLogsModal } from './SystemHealth/ServiceLogsModal'
import type { SystemHealthResponse, ServiceHealth as ServiceHealthType } from '@/core/api/types'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ServiceStatus = 'Operational' | 'Degraded' | 'Down' | 'Maintenance'

interface Service {
  id: string
  name: string
  status: ServiceStatus
  uptime: string
  lastCheck: string
  responseTime: number
}

const mapStatus = (status?: string): ServiceStatus => {
  switch ((status || '').toLowerCase()) {
    case 'operational':
      return 'Operational'
    case 'degraded':
    case 'partialoutage':
    case 'partial_outage':
      return 'Degraded'
    case 'maintenance':
      return 'Maintenance'
    case 'down':
    case 'outage':
    case 'failed':
      return 'Down'
    default:
      return 'Operational'
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * System Health Page
 * 
 * RBAC Controls:
 * - access: ADMIN, OPERATOR
 * - restart: ADMIN only
 * - configure: ADMIN only
 */
export function SystemHealth() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'systemHealth')
  const { data: healthData, isLoading, error } = useSystemHealth()
  const { data: events } = useSystemEvents(50)
  const restartMutation = useRestartService()
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [confirmRestart, setConfirmRestart] = useState<string | null>(null)

  const typedHealthData = healthData as SystemHealthResponse | undefined

  const services: Service[] = (typedHealthData?.services || []).map((s: ServiceHealthType) => ({
    id: s.name,
    name: s.name,
    status: mapStatus(s.status),
    uptime: s.uptime || '—',
    lastCheck: s.lastCheck ? new Date(s.lastCheck).toLocaleString() : '—',
    responseTime: s.responseTime ?? 0,
  }))

  const operational = services.filter((s) => s.status === 'Operational').length
  const degraded = services.filter((s) => s.status === 'Degraded').length
  const down = services.filter((s) => s.status === 'Down').length

  function statusColor(s: ServiceStatus) {
    switch (s) {
      case 'Operational': return 'approved'
      case 'Degraded': return 'pending'
      case 'Down': return 'rejected'
      case 'Maintenance': return 'sendback'
    }
  }

  function statusDot(s: ServiceStatus) {
    switch (s) {
      case 'Operational': return 'bg-ok'
      case 'Degraded': return 'bg-warn'
      case 'Down': return 'bg-danger'
      case 'Maintenance': return 'bg-muted'
    }
  }

  async function handleRestart(serviceName: string) {
    try {
      const result = await restartMutation.mutateAsync(serviceName)

      if (result.success) {
        alert(`✅ ${result.message}`)
      } else {
        alert(`❌ ${result.message}`)
      }
    } catch (err) {
      alert(`❌ Failed to restart ${serviceName}: ${getErrorMessage(err)}`)
    } finally {
      setConfirmRestart(null)
    }
  }

  return (
    <DashboardLayout pageTitle="System Health">
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Services</div>
          <div className="text-xl font-bold text-text">{services.length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Operational</div>
          <div className="text-xl font-bold text-ok">{operational}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Degraded</div>
          <div className="text-xl font-bold text-warn">{degraded}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Down</div>
          <div className="text-xl font-bold text-danger">{down}</div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {isLoading && (
          <div className="col-span-full py-12">
            <TextSkeleton lines={2} centered />
          </div>
        )}
        {!isLoading && services.length === 0 && <div className="col-span-full py-12 text-center text-muted">No health data available</div>}
        {!isLoading && services.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusDot(s.status)}`} />
                <span className="font-semibold text-text">{s.name}</span>
              </div>
              <span className={`pill ${statusColor(s.status)}`}>{s.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted">Uptime</div>
                <div className="font-medium">{s.uptime}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Response</div>
                <div className="font-medium">{s.responseTime}ms</div>
              </div>
              <div>
                <div className="text-xs text-muted">Last Check</div>
                <div className="font-medium text-xs">{s.lastCheck}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-light flex gap-2">
              <button
                className="btn secondary text-xs flex-1"
                onClick={() => setSelectedService(s.name)}
              >
                📄 View Logs
              </button>
              {perms.restart && (
                <button
                  className="btn secondary text-xs"
                  onClick={() => setConfirmRestart(s.name)}
                  disabled={restartMutation.isPending}
                >
                  Restart
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <div className="card">
        <h3 className="font-semibold text-text mb-3">Recent System Events</h3>
        <div className="space-y-2">
          {!events || events.length === 0 ? (
            <div className="text-sm text-muted">No recent events.</div>
          ) : (
            events.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted text-xs">{new Date(e.time).toLocaleString()}</span>
                <span className={`pill text-xs ${e.severity === 'warning'
                  ? 'bg-warn/20 text-warn'
                  : e.severity === 'error'
                    ? 'bg-rose-100 text-rose-700'
                    : e.severity === 'resolved'
                      ? 'bg-ok/20 text-ok'
                      : 'bg-muted/30 text-muted'
                  }`}>{e.severity}</span>
                <span className="flex-1">{e.message}</span>
                {e.service && <span className="text-muted text-xs">[{e.service}]</span>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Logs Modal */}
      {selectedService && (
        <ServiceLogsModal
          serviceName={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}

      {/* Restart Confirmation */}
      {confirmRestart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmRestart(null)}>
          <div
            className="bg-surface rounded-lg shadow-xl p-6 max-w-md m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-text mb-2">Confirm Restart</h3>
            <p className="text-muted mb-4">
              Are you sure you want to restart <strong>{confirmRestart}</strong>?
              This may cause brief downtime.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmRestart(null)}
                className="btn secondary"
                disabled={restartMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestart(confirmRestart)}
                className="btn primary"
                disabled={restartMutation.isPending}
              >
                {restartMutation.isPending ? 'Restarting...' : 'Restart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
