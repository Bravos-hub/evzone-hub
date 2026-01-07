import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

type AuditCategory = 'Auth' | 'Config' | 'User' | 'Station' | 'Billing' | 'System'
type AuditSeverity = 'Info' | 'Warning' | 'Critical'

type AuditEntry = {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  category: AuditCategory
  action: string
  target: string
  details: string
  ip: string
  severity: AuditSeverity
}

const mockAuditLogs: AuditEntry[] = [
  { id: 'AUD-001', timestamp: '2024-12-24 09:45:23', actor: 'Sarah Chen', actorRole: 'Admin', category: 'Config', action: 'Feature flag toggled', target: 'dark_mode_beta', details: 'Enabled for all users', ip: '192.168.1.1', severity: 'Info' },
  { id: 'AUD-002', timestamp: '2024-12-24 09:30:15', actor: 'John Operator', actorRole: 'Operator', category: 'Station', action: 'Station rebooted', target: 'ST-0001', details: 'Remote reboot initiated', ip: '10.0.0.5', severity: 'Warning' },
  { id: 'AUD-003', timestamp: '2024-12-24 09:15:00', actor: 'Sarah Chen', actorRole: 'Admin', category: 'User', action: 'User suspended', target: 'USR-006', details: 'Reason: Policy violation', ip: '192.168.1.1', severity: 'Critical' },
  { id: 'AUD-004', timestamp: '2024-12-24 08:00:00', actor: 'System', actorRole: 'System', category: 'System', action: 'Backup completed', target: 'Database', details: 'Daily backup successful', ip: '—', severity: 'Info' },
  { id: 'AUD-005', timestamp: '2024-12-23 22:30:45', actor: 'Sarah Chen', actorRole: 'Admin', category: 'Auth', action: 'Password reset', target: 'USR-003', details: 'Admin-initiated reset', ip: '192.168.1.1', severity: 'Warning' },
  { id: 'AUD-006', timestamp: '2024-12-23 18:15:30', actor: 'John Operator', actorRole: 'Operator', category: 'Billing', action: 'Refund issued', target: 'TXN-4521', details: 'Amount: $45.00', ip: '10.0.0.5', severity: 'Info' },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Audit Logs Page - Admin only
 */
export function AuditLogs() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'auditLogs')

  const [q, setQ] = useState('')
  const [category, setCategory] = useState<AuditCategory | 'All'>('All')
  const [severity, setSeverity] = useState<AuditSeverity | 'All'>('All')

  const filtered = useMemo(() => {
    return mockAuditLogs
      .filter((r) => (q ? (r.actor + ' ' + r.action + ' ' + r.target + ' ' + r.details).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (category === 'All' ? true : r.category === category))
      .filter((r) => (severity === 'All' ? true : r.severity === severity))
  }, [q, category, severity])

  function sevColor(s: AuditSeverity) {
    switch (s) {
      case 'Info': return 'bg-muted/30 text-muted'
      case 'Warning': return 'bg-warn/20 text-warn'
      case 'Critical': return 'bg-danger/20 text-danger'
    }
  }

  return (
    <DashboardLayout pageTitle="Audit Logs">
      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search logs"
            className="input col-span-2 xl:col-span-1"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value as AuditCategory | 'All')} className="select">
            <option value="All">All Categories</option>
            <option value="Auth">Auth</option>
            <option value="Config">Config</option>
            <option value="User">User</option>
            <option value="Station">Station</option>
            <option value="Billing">Billing</option>
            <option value="System">System</option>
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as AuditSeverity | 'All')} className="select">
            <option value="All">All Severity</option>
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      {perms.export && (
        <div className="flex items-center gap-2 mb-4">
          <button className="btn secondary" onClick={() => alert('Export audit logs (demo)')}>
            Export
          </button>
        </div>
      )}

      {/* Logs Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Category</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>IP</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="text-sm text-muted whitespace-nowrap">{r.timestamp}</td>
                <td>
                  <div className="font-medium">{r.actor}</div>
                  <div className="text-xs text-muted">{r.actorRole}</div>
                </td>
                <td><span className="chip">{r.category}</span></td>
                <td className="font-medium">{r.action}</td>
                <td className="text-sm">{r.target}</td>
                <td className="text-sm text-muted max-w-[200px] truncate">{r.details}</td>
                <td className="text-sm text-muted">{r.ip}</td>
                <td>
                  <span className={`pill ${sevColor(r.severity)}`}>{r.severity}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

