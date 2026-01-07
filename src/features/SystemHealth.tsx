import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

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

const mockServices: Service[] = [
  { id: 'SVC-001', name: 'API Gateway', status: 'Operational', uptime: '99.99%', lastCheck: '30s ago', responseTime: 45 },
  { id: 'SVC-002', name: 'OCPP Backend', status: 'Operational', uptime: '99.95%', lastCheck: '30s ago', responseTime: 120 },
  { id: 'SVC-003', name: 'Payment Service', status: 'Degraded', uptime: '99.80%', lastCheck: '30s ago', responseTime: 850 },
  { id: 'SVC-004', name: 'Database Primary', status: 'Operational', uptime: '99.99%', lastCheck: '30s ago', responseTime: 12 },
  { id: 'SVC-005', name: 'Message Queue', status: 'Operational', uptime: '99.97%', lastCheck: '30s ago', responseTime: 35 },
  { id: 'SVC-006', name: 'Analytics Pipeline', status: 'Maintenance', uptime: '98.50%', lastCheck: '5m ago', responseTime: 0 },
]

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

  const operational = mockServices.filter((s) => s.status === 'Operational').length
  const degraded = mockServices.filter((s) => s.status === 'Degraded').length
  const down = mockServices.filter((s) => s.status === 'Down').length

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
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Services</div>
          <div className="text-xl font-bold text-text">{mockServices.length}</div>
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
        {mockServices.map((s) => (
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
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">10m ago</span>
            <span className="pill bg-warn/20 text-warn">Warning</span>
            <span>Payment Service latency increased to 850ms</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">1h ago</span>
            <span className="pill bg-muted/30 text-muted">Info</span>
            <span>Analytics Pipeline scheduled maintenance started</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">3h ago</span>
            <span className="pill bg-ok/20 text-ok">Resolved</span>
            <span>Database failover completed successfully</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

