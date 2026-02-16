import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useTariffs, useCreateTariff, useUpdateTariff } from '@/modules/finance/billing/useTariffs'
import { getErrorMessage } from '@/core/api/errors'
import type { Tariff } from '@/core/types/domain'
import { TariffEditor } from './tariffs/TariffEditor'
import { StatGridSkeleton, TableSkeleton } from '@/ui/components/SkeletonCards'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

// Removed local types in favor of domain types

function getTariffBaseRate(tariff: Tariff): number {
  const firstElement = tariff.elements?.[0]
  return firstElement?.pricePerKwh || firstElement?.pricePerMinute || 0
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tariffs Page - Owner/Station Admin feature
 */
export function Tariffs() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'tariffs')

  const [showEditor, setShowEditor] = useState(false)
  const [editingTariff, setEditingTariff] = useState<Tariff | undefined>(undefined)

  const { data: tariffsData, isLoading, error } = useTariffs({ status: 'active' })
  const createTariffMutation = useCreateTariff()
  const updateTariffMutation = useUpdateTariff()

  const tariffs = useMemo(() => tariffsData || [], [tariffsData])

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
              ${tariffs.length > 0 ? (tariffs.reduce((a, t) => a + getTariffBaseRate(t), 0) / tariffs.length).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      )}

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
              {tariffs.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold text-text">{t.name}</td>
                  <td><span className="chip">{t.type}</span></td>
                  <td><span className="chip">{t.paymentModel}</span></td>
                  <td>${getTariffBaseRate(t).toFixed(2)}</td>
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

