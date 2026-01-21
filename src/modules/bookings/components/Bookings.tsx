import { useMemo, useState } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useBookings } from '@/core/api/hooks/useBookings'
import { getErrorMessage } from '@/core/api/errors'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'No-show'

type Booking = {
  id: string
  customer: string
  phone: string
  station: string
  bay: string
  scheduledAt: string
  duration: string
  status: BookingStatus
}

// Helper function to map API booking to Booking type
function mapApiBookingToBooking(apiBooking: any): Booking {
  return {
    id: apiBooking.id,
    customer: 'User', // API doesn't provide customer name directly
    phone: '', // API doesn't provide phone
    station: apiBooking.stationId || 'Unknown',
    bay: apiBooking.connectorId || 'N/A',
    scheduledAt: apiBooking.startTime || new Date().toISOString(),
    duration: apiBooking.endTime 
      ? `${Math.round((new Date(apiBooking.endTime).getTime() - new Date(apiBooking.startTime).getTime()) / 60000)} min`
      : 'N/A',
    status: apiBooking.status === 'CONFIRMED' ? 'Confirmed' 
      : apiBooking.status === 'PENDING' ? 'Pending'
      : apiBooking.status === 'COMPLETED' ? 'Completed'
      : apiBooking.status === 'CANCELLED' ? 'Cancelled'
      : 'Pending' as BookingStatus,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bookings Page - Station staff feature
 */
export function Bookings() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'bookings')

  const { data: bookingsData, isLoading, error } = useBookings()

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'All'>('All')
  const [dateFilter, setDateFilter] = useState('2024-12-24')

  // Map API bookings to Booking format
  const bookings = useMemo(() => {
    if (!bookingsData) return []
    return bookingsData.map(mapApiBookingToBooking)
  }, [bookingsData])

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => (q ? (b.customer + ' ' + b.phone + ' ' + b.id).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((b) => (statusFilter === 'All' ? true : b.status === statusFilter))
  }, [bookings, q, statusFilter])

  const stats = {
    total: filtered.length,
    confirmed: bookings.filter((b) => b.status === 'Confirmed').length,
    pending: bookings.filter((b) => b.status === 'Pending').length,
  }

  function statusColor(s: BookingStatus) {
    switch (s) {
      case 'Confirmed': return 'approved'
      case 'Pending': return 'pending'
      case 'Completed': return 'bg-ok/20 text-ok'
      case 'Cancelled': return 'rejected'
      case 'No-show': return 'bg-muted/30 text-muted'
    }
  }

  // Remove DashboardLayout wrapper - this is now rendered within Stations tabs
  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {getErrorMessage(error)}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card mb-4">
          <div className="text-center py-8 text-muted">Loading bookings...</div>
        </div>
      )}

      {/* Summary */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="card">
              <div className="text-xs text-muted">Today's Bookings</div>
              <div className="text-xl font-bold text-text">{stats.total}</div>
            </div>
            <div className="card">
              <div className="text-xs text-muted">Confirmed</div>
              <div className="text-xl font-bold text-ok">{stats.confirmed}</div>
            </div>
            <div className="card">
              <div className="text-xs text-muted">Pending</div>
              <div className="text-xl font-bold text-warn">{stats.pending}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bookings" className="input" />
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="input" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'All')} className="select">
                <option value="All">All Status</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No-show">No-show</option>
              </select>
              {perms.create && (
                <button className="btn secondary" onClick={() => alert('New booking (demo)')}>
                  + New Booking
                </button>
              )}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Station / Bay</th>
                  <th>Scheduled</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      <td className="font-semibold text-text">{b.id}</td>
                      <td>
                        <div>{b.customer}</div>
                        <div className="text-xs text-muted">{b.phone}</div>
                      </td>
                      <td>
                        <div>{b.station}</div>
                        <div className="text-xs text-muted">{b.bay}</div>
                      </td>
                      <td className="text-sm">{b.scheduledAt}</td>
                      <td>{b.duration}</td>
                      <td><span className={`pill ${statusColor(b.status)}`}>{b.status}</span></td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="btn secondary" onClick={() => alert(`View ${b.id} (demo)`)}>View</button>
                          {perms.cancel && b.status === 'Pending' && (
                            <button className="btn danger" onClick={() => alert(`Cancel ${b.id} (demo)`)}>Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

