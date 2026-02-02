import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useSystemHealth } from '@/modules/analytics/hooks/useAnalytics'
import { getErrorMessage } from '@/core/api/errors'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

type ServiceStatus = 'Operational' | 'Degraded' | 'Down' | 'Maintenance'

type Service = {
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
  const { data: healthData, isLoading, error } = useSystemHealth() as any

  const services: Service[] = (healthData?.services || []).map((s: any) => ({
    id: s.id || s.name,
    name: s.name || s.service || 'Service',
    status: mapStatus(s.status),
    uptime: s.uptime || s.uptimePercent || '—',
    lastCheck: s.lastCheck || s.updatedAt || '—',
    responseTime: s.responseTime ?? s.latency ?? 0,
  }))

  const events = (healthData?.events || []).map((e: any) => ({
    id: e.id || e.timestamp || e.time || e.message,
    time: e.time || e.timestamp || e.createdAt || '—',
    severity: e.severity || e.level || 'Info',
    message: e.message || e.title || '—',
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
        {isLoading && <div className="col-span-full py-12 text-center text-muted">Loading health data...</div>}
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
                <div className="font-medium">{s.lastCheck}</div>
              </div>
            </div>
            {perms.restart && (
              <div className="mt-3 pt-3 border-t border-border-light">
                <button className="btn secondary text-xs" onClick={() => alert(`Restart ${s.name} (demo)`)}>
                  Restart
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Incidents */}
      <div className="card">
        <h3 className="font-semibold text-text mb-3">Recent System Events</h3>
        <div className="space-y-2">
          {isLoading && <div className="text-sm text-muted">Loading events...</div>}
          {!isLoading && events.length === 0 && <div className="text-sm text-muted">No recent events.</div>}
          {!isLoading && events.map((e: any) => (
            <div key={e.id} className="flex items-center gap-3 text-sm">
              <span className="text-muted">{e.time}</span>
              <span className={`pill ${
                e.severity.toLowerCase() === 'warning'
                  ? 'bg-warn/20 text-warn'
                  : e.severity.toLowerCase() === 'error'
                    ? 'bg-rose-100 text-rose-700'
                    : e.severity.toLowerCase() === 'resolved'
                      ? 'bg-ok/20 text-ok'
                      : 'bg-muted/30 text-muted'
              }`}>{e.severity}</span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

