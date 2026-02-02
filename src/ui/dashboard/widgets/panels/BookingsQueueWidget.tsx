import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useBookings } from '@/modules/bookings/hooks/useBookings'
import { useMemo } from 'react'
import { LoadingRow } from '@/ui/components/SkeletonCards'

export type BookingsQueueConfig = {
  title?: string
  subtitle?: string
  stationName?: string
  stationId?: string
  maxBookings?: number
  statusFilter?: string
}

function statusClass(status: string) {
  const statusLower = status?.toLowerCase()
  if (statusLower === 'confirmed') return 'approved'
  if (statusLower === 'pending') return 'pending'
  if (statusLower === 'completed') return 'bg-ok/10 text-ok border-ok/40'
  if (statusLower === 'cancelled') return 'rejected'
  if (statusLower === 'no-show') return 'bg-muted/30 text-muted border-border-light'
  return 'pending'
}

export function BookingsQueueWidget({ config }: WidgetProps<BookingsQueueConfig>) {
  const {
    title = 'Bookings',
    subtitle,
    stationName,
    stationId,
    maxBookings = 10,
    statusFilter
  } = config ?? {}

  const effectiveSubtitle = subtitle ?? (stationName ? `Bookings for ${stationName}` : undefined)

  // Fetch bookings from API
  const { data: bookings, isLoading } = useBookings()

  const displayBookings = useMemo(() => {
    if (!bookings) return []
    return bookings.slice(0, maxBookings)
  }, [bookings, maxBookings])

  const formatTime = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-start justify-between gap-3">
        <div>
          <div className="card-title">{title}</div>
          {effectiveSubtitle && <div className="text-xs text-muted">{effectiveSubtitle}</div>}
        </div>
        <div className="text-[10px] uppercase font-semibold text-muted">{bookings?.length || 0} today</div>
      </div>
      <div className="p-4 overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="text-left">Booking</th>
              <th className="text-left">Customer</th>
              <th className="text-left">Service</th>
              <th className="text-left">Time</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRow colSpan={5} />
            ) : displayBookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted text-sm italic">
                  No bookings for this station today.
                </td>
              </tr>
            ) : (
              displayBookings.map((b: any) => (
                <tr key={b.id}>
                  <td className="font-semibold text-text">{b.bookingNumber || b.id}</td>
                  <td>
                    <div>{b.customerName || b.customer || 'Unknown'}</div>
                    <div className="text-xs text-muted">{b.bay || b.connectorId || 'TBD'}</div>
                  </td>
                  <td>{b.serviceType || b.service || 'Charge'}</td>
                  <td className="text-sm">{formatTime(b.scheduledTime || b.time || b.createdAt)}</td>
                  <td>
                    <span className={`pill ${statusClass(b.status)}`}>{b.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-panel/20 border-t border-border-light flex items-center justify-end">
        <button className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
          View all bookings
        </button>
      </div>
    </Card>
  )
}
