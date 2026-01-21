import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { getPermissionsForFeature } from '@/constants/permissions'
import { canAccessStation, capabilityAllowsCharge } from '@/core/auth/rbac'
import { StationStatusPill, type StationStatus } from '@/ui/components/StationStatusPill'
import { useChargePoints, useRebootChargePoint } from '@/modules/charge-points/hooks/useChargePoints'
import { useStations } from '@/modules/stations/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'

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
  const { data: me, isLoading: meLoading } = useMe()

  const [q, setQ] = useState('')
  const [siteFilter, setSiteFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<StationStatus | 'All'>('All')

  const { data: chargePointsData, isLoading, error } = useChargePoints()
  const { mutate: reboot } = useRebootChargePoint()
  const { data: stations, isLoading: stationsLoading } = useStations()

  const needsScope = user?.role === 'OWNER' || user?.role === 'STATION_OPERATOR'
  const capability = me?.ownerCapability || user?.ownerCapability

  const accessContext = useMemo(() => ({
    role: user?.role,
    orgId: me?.orgId || me?.organizationId,
    assignedStations: me?.assignedStations || [],
    capability,
    viewAll: perms.viewAll,
  }), [user?.role, me?.orgId, me?.organizationId, me?.assignedStations, capability, perms.viewAll])

  const accessibleChargeStations = useMemo(() => {
    return (stations || []).filter((station) => canAccessStation(accessContext, station, 'CHARGE'))
  }, [stations, accessContext])

  const stationLookup = useMemo(() => {
    const map = new Map<string, { name: string }>()
    accessibleChargeStations.forEach((station) => {
      map.set(station.id, { name: station.name })
    })
    return map
  }, [accessibleChargeStations])

  // Map API charge points to display format
  const chargePoints = useMemo(() => {
    if (!chargePointsData) return []
    const allowedStationIds = new Set(accessibleChargeStations.map((station) => station.id))
    return chargePointsData
      .filter((cp) => (needsScope ? allowedStationIds.has(cp.stationId) : true))
      .map(cp => ({
        id: cp.id,
        name: cp.model,
        site: stationLookup.get(cp.stationId)?.name || 'Unknown',
        make: cp.manufacturer,
        model: cp.model,
        status: cp.status,
        connectors: cp.connectors.map(c => ({
          type: c.type,
          kw: c.maxPowerKw,
          status: c.status,
        })),
        lastSession: 'N/A',
        totalSessions: 0,
      }))
  }, [chargePointsData, accessibleChargeStations, stationLookup, needsScope])

  const sites = useMemo(() => ['All', ...new Set(chargePoints.map((c) => c.site))], [chargePoints])

  const filtered = useMemo(() => {
    return chargePoints
      .filter((c) => (q ? (c.id + ' ' + c.name + ' ' + c.make).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((c) => (siteFilter === 'All' ? true : c.site === siteFilter))
      .filter((c) => (statusFilter === 'All' ? true : c.status === statusFilter))
  }, [chargePoints, q, siteFilter, statusFilter])

  const stats = {
    total: chargePoints.length,
    online: chargePoints.filter((c) => c.status === 'Online').length,
    offline: chargePoints.filter((c) => c.status === 'Offline' || c.status === 'Degraded').length,
  }

  const accessLoading = needsScope && (meLoading || stationsLoading)
  const capabilityDenied = needsScope && !capabilityAllowsCharge(capability)

  // Remove DashboardLayout wrapper - this is now rendered within Stations tabs
  if (!perms.access) {
    return (
      <div className="card">
        <p className="text-muted">You don't have permission to view this page.</p>
      </div>
    )
  }

  if (capabilityDenied) {
    return (
      <div className="card">
        <p className="text-muted">You don't have permission to view charge stations.</p>
      </div>
    )
  }

  return (
    <>
      {accessLoading && (
        <div className="card mb-4">
          <div className="text-center py-8 text-muted">Loading access...</div>
        </div>
      )}

      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}

      {isLoading && (
        <div className="card mb-4">
          <div className="text-center py-8 text-muted">Loading charge points...</div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && !accessLoading && (
        <>
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
                          <span key={i} className={`chip text-xs ${conn.status === 'Available' || conn.status === 'Occupied' ? 'bg-ok/20 text-ok' : 'bg-danger/20 text-danger'}`}>
                            {conn.type} {conn.kw}kW
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-sm text-muted">{c.lastSession}</td>
                    <td>{c.totalSessions.toLocaleString()}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <button className="btn secondary" onClick={() => nav(`/stations/charge-points/${c.id}`)}>View</button>
                        {perms.remoteCommands && (
                          <button
                            className="btn secondary"
                            onClick={() => {
                              if (confirm(`Are you sure you want to reboot ${c.id}?`)) {
                                reboot(c.id, {
                                  onSuccess: () => alert('Reboot command sent successfully')
                                })
                              }
                            }}
                          >
                            Reboot
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

