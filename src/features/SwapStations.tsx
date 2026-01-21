import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { getPermissionsForFeature } from '@/constants/permissions'
import { canAccessStation, capabilityAllowsSwap } from '@/core/auth/rbac'
import { PATHS } from '@/app/router/paths'
import { StationStatusPill, type StationStatus } from '@/ui/components/StationStatusPill'
import { useStations } from '@/modules/stations/hooks/useStations'
import { stationService } from '@/modules/stations/services/stationService'
import { queryKeys } from '@/data/queryKeys'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SwapStation = {
  id: string
  stationId: string
  name: string
  site: string
  status: StationStatus
  bays: number
  available: number
  charging: number
  swapsToday: number
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Swap Stations Page - Owner feature
 */
export function SwapStations() {
  const nav = useNavigate()
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'swapStations')
  const { data: stations, isLoading } = useStations()
  const { data: me, isLoading: meLoading } = useMe()

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<StationStatus | 'All'>('All')

  const needsScope = user?.role === 'OWNER' || user?.role === 'STATION_OPERATOR'
  const capability = me?.ownerCapability || user?.ownerCapability

  const accessibleSwapStations = useMemo(() => {
    const role = user?.role
    const ownerOrgId = me?.orgId || me?.organizationId
    const assignedStations = me?.assignedStations || []

    const accessContext = {
      role,
      orgId: ownerOrgId,
      assignedStations,
      capability,
      viewAll: perms.viewAll,
    }

    return (stations || []).filter((station) => canAccessStation(accessContext, station, 'SWAP'))
  }, [stations, user?.role, me?.orgId, me?.organizationId, me?.assignedStations, capability, perms.viewAll])

  const swapStationIds = useMemo(() => {
    return accessibleSwapStations.map((station) => station.id)
  }, [accessibleSwapStations])

  const batteryQueries = useQueries({
    queries: swapStationIds.map((stationId) => ({
      queryKey: queryKeys.stations.batteries(stationId),
      queryFn: () => stationService.getBatteries(stationId),
      enabled: !!stationId,
    })),
  })

  const swapsTodayQueries = useQueries({
    queries: swapStationIds.map((stationId) => ({
      queryKey: queryKeys.stations.swapsToday(stationId),
      queryFn: () => stationService.getSwapsToday(stationId),
      enabled: !!stationId,
    })),
  })

  const batteryCounts = useMemo(() => {
    const map = new Map<string, { ready: number; charging: number }>()
    batteryQueries.forEach((query, index) => {
      const stationId = swapStationIds[index]
      const batteries = query.data || []
      const ready = batteries.filter((b) => b.status === 'Ready').length
      const charging = batteries.filter((b) => b.status === 'Charging').length
      map.set(stationId, { ready, charging })
    })
    return map
  }, [batteryQueries, swapStationIds])

  const swapsTodayCounts = useMemo(() => {
    const map = new Map<string, number>()
    swapsTodayQueries.forEach((query, index) => {
      const stationId = swapStationIds[index]
      const count = query.data?.count ?? 0
      map.set(stationId, count)
    })
    return map
  }, [swapsTodayQueries, swapStationIds])

  const swapStations = useMemo<SwapStation[]>(() => {
    const mapStatus = (status?: string): StationStatus => {
      if (status === 'ACTIVE') return 'Online'
      if (status === 'INACTIVE') return 'Offline'
      return 'Maintenance'
    }

    return accessibleSwapStations.map((station) => ({
      id: station.code || station.id,
      stationId: station.id,
      name: station.name,
      site: station.address || 'Unknown site',
      status: mapStatus(station.status),
      bays: station.parkingBays || station.capacity || 0,
      available: batteryCounts.get(station.id)?.ready || 0,
      charging: batteryCounts.get(station.id)?.charging || 0,
      swapsToday: swapsTodayCounts.get(station.id) || 0,
    }))
  }, [accessibleSwapStations, batteryCounts, swapsTodayCounts])

  const filtered = useMemo(() => {
    return swapStations
      .filter((s) => (q ? (s.id + ' ' + s.name + ' ' + s.site).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((s) => (statusFilter === 'All' ? true : s.status === statusFilter))
  }, [swapStations, q, statusFilter])

  const accessLoading = needsScope && meLoading
  const capabilityDenied = needsScope && !capabilityAllowsSwap(capability)

  const stats = {
    totalBays: swapStations.reduce((a, s) => a + s.bays, 0),
    available: swapStations.reduce((a, s) => a + s.available, 0),
    charging: swapStations.reduce((a, s) => a + s.charging, 0),
    swapsToday: swapStations.reduce((a, s) => a + s.swapsToday, 0),
  }

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
        <p className="text-muted">You don't have permission to view swap stations.</p>
      </div>
    )
  }

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Bays</div>
          <div className="text-xl font-bold text-text">{stats.totalBays}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Available</div>
          <div className="text-xl font-bold text-ok">{stats.available}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Charging</div>
          <div className="text-xl font-bold text-warn">{stats.charging}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Swaps Today</div>
          <div className="text-xl font-bold text-accent">{stats.swapsToday}</div>
        </div>
      </div>

      {/* Actions */}
      {perms.create && (
        <div className="flex items-center gap-2 mb-4">
          <button className="btn secondary" onClick={() => nav(PATHS.OWNER.ADD_SWAP_STATION)}>
            + Add Swap Station
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search swap stations" className="input flex-1" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StationStatus | 'All')} className="select">
            <option value="All">All Status</option>
            <option value="Online">Online</option>
            <option value="Degraded">Degraded</option>
            <option value="Offline">Offline</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Swap Stations Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Station</th>
              <th>Site</th>
              <th>Status</th>
              <th>Bays</th>
              <th>Available</th>
              <th>Charging</th>
              <th>Swaps Today</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="font-semibold text-text">{s.id}</div>
                  <div className="text-xs text-muted">{s.name}</div>
                </td>
                <td>{s.site}</td>
                <td><StationStatusPill status={s.status} /></td>
                <td>{s.bays}</td>
                <td className="text-ok font-semibold">{s.available}</td>
                <td className="text-warn">{s.charging}</td>
                <td>{s.swapsToday}</td>
                <td className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="btn secondary" onClick={() => nav(PATHS.OPERATOR.SWAP_DETAIL(s.stationId))}>View</button>
                    {perms.edit && (
                      <button className="btn secondary" onClick={() => nav(PATHS.OPERATOR.SWAP_DETAIL(s.stationId))}>Manage</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {accessLoading && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-8">
                  Loading access...
                </td>
              </tr>
            )}
            {!isLoading && !accessLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-8">
                  No swap stations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

