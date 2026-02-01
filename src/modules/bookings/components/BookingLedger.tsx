import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

type LedgerRow = {
  id: string
  station: string
  type: 'booking' | 'walkin'
  booking: {
    amount: number
    method: string
    status: string
  } | null
  energy: {
    unit: string
    value: number
    amount: number
    currency: string
    method: string
  } | null
}

import { useBookings } from '@/modules/bookings/hooks/useBookings'

export function BookingLedger() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'bookings')
  const { data: bookings, isLoading } = useBookings()

  const rows = useMemo(() => {
    if (!bookings) return []
    return bookings.map((b: any): LedgerRow => ({
      id: b.id,
      station: b.stationId || 'Unknown',
      type: 'booking',
      booking: {
        amount: 0, // Placeholder as API doesn't return price yet
        method: 'App',
        status: b.status,
      },
      energy: null,
    }))
  }, [bookings])

  function sum(arr: any[], selector: (r: any) => number): number {
    return arr.reduce((acc, r) => acc + selector(r), 0)
  }

  const totalBookingUSD = useMemo(
    () => sum(rows, (r) => (r.booking?.amount ? r.booking.amount : 0)),
    [rows]
  )
  const totalEnergyUSD = useMemo(() => 0, [])
  const totalEnergyUGX = useMemo(() => 0, [])

  function exportCsv(kind: 'booking' | 'energy') {
    const header =
      kind === 'booking'
        ? ['id', 'type', 'station', 'bookingAmount', 'bookingMethod', 'bookingStatus'].join(',')
        : ['id', 'type', 'station', 'energyUnit', 'energyValue', 'energyAmount', 'currency', 'method'].join(',')

    const lines = rows.map((r) => {
      if (kind === 'booking') {
        return [r.id, r.type, r.station, r.booking?.amount || 0, r.booking?.method || '', r.booking?.status || ''].join(',')
      }
      const e = r.energy || { unit: '', value: '', amount: '', currency: '', method: '' }
      return [r.id, r.type, r.station, e.unit, e.value, e.amount, e.currency, e.method].join(',')
    })

    const csv = [header, ...lines].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger-${kind}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Booking Ledger">
        <div className="card">
          <p className="text-muted">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Booking Ledger">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs text-muted mb-1">Bookings (USD)</div>
          <div className="text-2xl font-bold text-text">${totalBookingUSD.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs text-muted mb-1">Energy (USD)</div>
          <div className="text-2xl font-bold text-text">${totalEnergyUSD.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs text-muted mb-1">Energy (UGX)</div>
          <div className="text-2xl font-bold text-text">{totalEnergyUGX.toLocaleString()}</div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button className="btn secondary" onClick={() => exportCsv('booking')}>
          Export Bookings CSV
        </button>
        <button className="btn secondary" onClick={() => exportCsv('energy')}>
          Export Energy CSV
        </button>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-muted">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Station</th>
                <th className="px-4 py-2 text-left">Booking</th>
                <th className="px-4 py-2 text-left">Energy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">Loading ledger...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted">No transactions found</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-alt">
                    <td className="px-4 py-2 font-medium">{r.id}</td>
                    <td className="px-4 py-2">
                      {r.type === 'walkin' ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-alt text-muted">Walk-in</span>
                      ) : (
                        'Booking'
                      )}
                    </td>
                    <td className="px-4 py-2">{r.station}</td>
                    <td className="px-4 py-2">
                      {r.booking
                        ? `$${r.booking.amount.toFixed(2)} • ${r.booking.method} • ${r.booking.status}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2">
                      {r.energy
                        ? `${r.energy.value} ${r.energy.unit} • ${r.energy.currency === 'USD'
                          ? `$${r.energy.amount.toFixed(2)}`
                          : `${r.energy.amount.toLocaleString()} UGX`
                        } • ${r.energy.method}`
                        : '—'}
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  )
}

