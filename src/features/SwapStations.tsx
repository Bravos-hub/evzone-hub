import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { StationStatusPill, type StationStatus } from '@/ui/components/StationStatusPill'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

type SwapStation = {
  id: string
  name: string
  site: string
  status: StationStatus
  bays: number
  available: number
  charging: number
  swapsToday: number
}

const mockSwapStations: SwapStation[] = [
  { id: 'SW-001', name: 'Main Swap Hub', site: 'Central Hub', status: 'Online', bays: 24, available: 18, charging: 6, swapsToday: 142 },
  { id: 'SW-002', name: 'Gulu Station', site: 'Gulu Main Street', status: 'Degraded', bays: 18, available: 10, charging: 5, swapsToday: 67 },
  { id: 'SW-003', name: 'Airport Swap', site: 'Entebbe Airport', status: 'Online', bays: 12, available: 9, charging: 3, swapsToday: 45 },
]

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

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<StationStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return mockSwapStations
      .filter((s) => (q ? (s.id + ' ' + s.name + ' ' + s.site).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((s) => (statusFilter === 'All' ? true : s.status === statusFilter))
  }, [q, statusFilter])

  const stats = {
    totalBays: mockSwapStations.reduce((a, s) => a + s.bays, 0),
    available: mockSwapStations.reduce((a, s) => a + s.available, 0),
    charging: mockSwapStations.reduce((a, s) => a + s.charging, 0),
    swapsToday: mockSwapStations.reduce((a, s) => a + s.swapsToday, 0),
  }

  // Remove DashboardLayout wrapper - this is now rendered within Stations tabs
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
          <button className="btn secondary" onClick={() => alert('Add swap station (demo - route to be created)')}>
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
                    <button className="btn secondary" onClick={() => alert(`View ${s.id} (demo)`)}>View</button>
                    {perms.edit && (
                      <button className="btn secondary" onClick={() => alert(`Manage ${s.id} (demo)`)}>Manage</button>
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

