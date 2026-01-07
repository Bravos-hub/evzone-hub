import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

type TariffType = 'Flat' | 'Time-based' | 'kWh-based' | 'Dynamic'

type Tariff = {
  id: string
  name: string
  type: TariffType
  baseRate: number
  currency: string
  stations: number
  active: boolean
  createdAt: string
}

const mockTariffs: Tariff[] = [
  { id: 'TAR-001', name: 'Standard Rate', type: 'kWh-based', baseRate: 0.35, currency: 'USD', stations: 5, active: true, createdAt: '2024-01-15' },
  { id: 'TAR-002', name: 'Peak Hours', type: 'Time-based', baseRate: 0.50, currency: 'USD', stations: 3, active: true, createdAt: '2024-02-20' },
  { id: 'TAR-003', name: 'Off-Peak', type: 'Time-based', baseRate: 0.25, currency: 'USD', stations: 3, active: true, createdAt: '2024-02-20' },
  { id: 'TAR-004', name: 'Fleet Discount', type: 'Flat', baseRate: 0.30, currency: 'USD', stations: 2, active: false, createdAt: '2024-03-10' },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tariffs Page - Owner/Station Admin feature
 */
export function Tariffs() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'tariffs')

  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<TariffType | 'All'>('All')
  const [showInactive, setShowInactive] = useState(false)

  const filtered = useMemo(() => {
    return mockTariffs
      .filter((t) => (q ? t.name.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((t) => (typeFilter === 'All' ? true : t.type === typeFilter))
      .filter((t) => (showInactive ? true : t.active))
  }, [q, typeFilter, showInactive])

  return (
    <DashboardLayout pageTitle="Tariffs & Pricing">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Tariffs</div>
          <div className="text-xl font-bold text-text">{mockTariffs.length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Active</div>
          <div className="text-xl font-bold text-ok">{mockTariffs.filter((t) => t.active).length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Avg Rate</div>
          <div className="text-xl font-bold text-accent">
            ${(mockTariffs.reduce((a, t) => a + t.baseRate, 0) / mockTariffs.length).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tariffs" className="input flex-1" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TariffType | 'All')} className="select">
            <option value="All">All Types</option>
            <option value="Flat">Flat</option>
            <option value="Time-based">Time-based</option>
            <option value="kWh-based">kWh-based</option>
            <option value="Dynamic">Dynamic</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="h-4 w-4" />
            Show inactive
          </label>
        </div>
      </div>

      {/* Actions */}
      {perms.edit && (
        <div className="mb-4">
          <button className="btn secondary" onClick={() => alert('Create tariff (demo)')}>
            + New Tariff
          </button>
        </div>
      )}

      {/* Tariffs Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tariff</th>
              <th>Type</th>
              <th>Base Rate</th>
              <th>Stations</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="font-semibold text-text">{t.name}</td>
                <td><span className="chip">{t.type}</span></td>
                <td>${t.baseRate.toFixed(2)} / kWh</td>
                <td>{t.stations}</td>
                <td>
                  <span className={`pill ${t.active ? 'approved' : 'rejected'}`}>
                    {t.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="text-sm">{t.createdAt}</td>
                <td className="text-right">
                  {perms.edit && (
                    <button className="btn secondary" onClick={() => alert(`Edit ${t.name} (demo)`)}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

