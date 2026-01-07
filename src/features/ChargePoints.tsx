import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { StationStatusPill, type StationStatus } from '@/ui/components/StationStatusPill'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

type ChargePoint = {
  id: string
  name: string
  site: string
  make: string
  model: string
  status: StationStatus
  connectors: Array<{ type: string; kw: number; status: StationStatus }>
  lastSession: string
  totalSessions: number
}

const mockChargePoints: ChargePoint[] = [
  {
    id: 'CP-001',
    name: 'Main Entrance A',
    site: 'Central Hub',
    make: 'ABB',
    model: 'Terra 54',
    status: 'Online',
    connectors: [
      { type: 'CCS2', kw: 50, status: 'Online' },
      { type: 'Type 2', kw: 22, status: 'Online' },
    ],
    lastSession: '15m ago',
    totalSessions: 1245,
  },
  {
    id: 'CP-002',
    name: 'Parking B4',
    site: 'Central Hub',
    make: 'Delta',
    model: 'DC Wall 25',
    status: 'Degraded',
    connectors: [
      { type: 'CHAdeMO', kw: 50, status: 'Offline' },
      { type: 'CCS2', kw: 50, status: 'Online' },
    ],
    lastSession: '2h ago',
    totalSessions: 892,
  },
  {
    id: 'CP-003',
    name: 'Visitor Lot',
    site: 'Airport East',
    make: 'Huawei',
    model: 'FusionCharge',
    status: 'Offline',
    connectors: [{ type: 'CCS2', kw: 120, status: 'Offline' }],
    lastSession: '1d ago',
    totalSessions: 456,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Charge Points Page - Owner feature
 */
export function ChargePoints() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'chargePoints')

  const [q, setQ] = useState('')
  const [siteFilter, setSiteFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<StationStatus | 'All'>('All')

  const sites = useMemo(() => ['All', ...new Set(mockChargePoints.map((c) => c.site))], [])

  const filtered = useMemo(() => {
    return mockChargePoints
      .filter((c) => (q ? (c.id + ' ' + c.name + ' ' + c.make).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((c) => (siteFilter === 'All' ? true : c.site === siteFilter))
      .filter((c) => (statusFilter === 'All' ? true : c.status === statusFilter))
  }, [q, siteFilter, statusFilter])

  const stats = {
    total: mockChargePoints.length,
    online: mockChargePoints.filter((c) => c.status === 'Online').length,
    offline: mockChargePoints.filter((c) => c.status === 'Offline' || c.status === 'Degraded').length,
  }

  // Remove DashboardLayout wrapper - this is now rendered within Stations tabs
  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Charge Points</div>
          <div className="text-xl font-bold text-text">{stats.total}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Online</div>
          <div className="text-xl font-bold text-ok">{stats.online}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Issues</div>
          <div className="text-xl font-bold text-danger">{stats.offline}</div>
        </div>
      </div>

      {/* Actions */}
      {perms.create && (
        <div className="flex items-center gap-2 mb-4">
          <button className="btn secondary" onClick={() => nav('/add-charger')}>
            + Add Charge Point
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search charge points" className="input col-span-2 xl:col-span-1" />
          <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="select">
            {sites.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Sites' : s}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StationStatus | 'All')} className="select">
            <option value="All">All Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Degraded">Degraded</option>
          </select>
        </div>
      </div>

      {/* Charge Points Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Charge Point</th>
              <th>Site</th>
              <th>Hardware</th>
              <th>Status</th>
              <th>Connectors</th>
              <th>Last Session</th>
              <th>Total Sessions</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="font-semibold text-text">{c.id}</div>
                  <div className="text-xs text-muted">{c.name}</div>
                </td>
                <td>{c.site}</td>
                <td>
                  <div>{c.make} {c.model}</div>
                </td>
                <td><StationStatusPill status={c.status} /></td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {c.connectors.map((conn, i) => (
                      <span key={i} className={`chip text-xs ${conn.status === 'Online' ? 'bg-ok/20 text-ok' : 'bg-danger/20 text-danger'}`}>
                        {conn.type} {conn.kw}kW
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-sm text-muted">{c.lastSession}</td>
                <td>{c.totalSessions.toLocaleString()}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="btn secondary" onClick={() => alert(`View ${c.id} (demo)`)}>View</button>
                    {perms.remoteCommands && (
                      <button className="btn secondary" onClick={() => alert(`Reboot ${c.id} (demo)`)}>Reboot</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

