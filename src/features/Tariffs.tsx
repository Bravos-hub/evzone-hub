import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useTariffs, useCreateTariff, useUpdateTariff, useDeleteTariff } from '@/modules/finance/billing/useTariffs'
import { useStations } from '@/modules/stations/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'
import type { Tariff, TariffType } from '@/core/types/domain'
import { TariffEditor } from './tariffs/TariffEditor'
import { StatGridSkeleton, TableSkeleton } from '@/ui/components/SkeletonCards'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

// Removed local types in favor of domain types

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
  const [showEditor, setShowEditor] = useState(false)
  const [editingTariff, setEditingTariff] = useState<Tariff | undefined>(undefined)

  const { data: tariffsData, isLoading, error } = useTariffs({ status: showInactive ? undefined : 'active' })
  const createTariffMutation = useCreateTariff()
  const updateTariffMutation = useUpdateTariff()
  const deleteTariffMutation = useDeleteTariff()

  const tariffs = useMemo(() => tariffsData || [], [tariffsData])

  const filtered = useMemo(() => {
    return tariffs
      .filter((t) => (q ? t.name.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((t) => (typeFilter === 'All' ? true : t.type === typeFilter))
      .filter((t) => (showInactive ? true : t.active))
  }, [tariffs, q, typeFilter, showInactive])

  const handleCreate = (data: any) => {
    createTariffMutation.mutate(data, {
      onSuccess: () => {
        setShowEditor(false)
        setEditingTariff(undefined)
      }
    })
  }

  const handleUpdate = (data: any) => {
    if (!editingTariff) return
    updateTariffMutation.mutate({ id: editingTariff.id, data }, {
      onSuccess: () => {
        setShowEditor(false)
        setEditingTariff(undefined)
      }
    })
  }

  const handleEditClick = (tariff: Tariff) => {
    setEditingTariff(tariff)
    setShowEditor(true)
  }

  return (
    <DashboardLayout pageTitle="Tariffs & Pricing">
      {/* Error Message */}
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(error)}</div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="table-wrap mb-4">
          <TableSkeleton rows={6} cols={7} />
        </div>
      )}

      {/* Summary */}
      {isLoading ? (
        <StatGridSkeleton count={3} className="mb-4" />
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card">
            <div className="text-xs text-muted">Total Tariffs</div>
            <div className="text-xl font-bold text-text">{tariffs.length}</div>
          </div>
          <div className="card">
            <div className="text-xs text-muted">Active</div>
            <div className="text-xl font-bold text-ok">{tariffs.filter((t) => t.active).length}</div>
          </div>
          <div className="card">
            <div className="text-xs text-muted">Avg Rate</div>
            <div className="text-xl font-bold text-accent">
              ${tariffs.length > 0 ? (tariffs.reduce((a, t) => a + (t.elements[0]?.pricePerKwh || 0), 0) / tariffs.length).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tariffs" className="input flex-1" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TariffType | 'All')} className="select">
            <option value="All">All Types</option>
            <option value="Fixed">Fixed</option>
            <option value="Time-based">Time-based</option>
            <option value="Energy-based">Energy-based</option>
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
          <button className="btn secondary" onClick={() => { setEditingTariff(undefined); setShowEditor(true); }}>
            + New Tariff
          </button>
        </div>
      )}

      {/* Tariffs Table */}
      {!isLoading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tariff</th>
                <th>Type</th>
                <th>Model</th>
                <th>Base Rate</th>
                <th>Stations</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold text-text">{t.name}</td>
                  <td><span className="chip">{t.type}</span></td>
                  <td><span className="chip">{t.paymentModel}</span></td>
                  <td>${(t.elements[0]?.pricePerKwh || t.elements[0]?.pricePerMinute || 0).toFixed(2)}</td>
                  <td>{t.applicableStations?.length || 0}</td>
                  <td>
                    <span className={`pill ${t.active ? 'approved' : 'rejected'}`}>
                      {t.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-right">
                    {perms.edit && (
                      <button className="btn secondary" onClick={() => handleEditClick(t)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditor && (
        <TariffEditor
          tariff={editingTariff}
          onSave={editingTariff ? handleUpdate : handleCreate}
          onCancel={() => setShowEditor(false)}
          isSaving={createTariffMutation.isPending || updateTariffMutation.isPending}
        />
      )}
    </DashboardLayout>
  )
}

