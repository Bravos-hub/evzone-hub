import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'No-show'

export type BookingItem = {
  id: string
  customer: string
  service: 'Charge' | 'Swap'
  time: string
  bay: string
  status: BookingStatus
}

export type BookingsQueueConfig = {
  title?: string
  subtitle?: string
  stationName?: string
  bookings: BookingItem[]
}

function statusClass(status: BookingStatus) {
  switch (status) {
    case 'Confirmed':
      return 'approved'
    case 'Pending':
      return 'pending'
    case 'Completed':
      return 'bg-ok/10 text-ok border-ok/40'
    case 'Cancelled':
      return 'rejected'
    case 'No-show':
      return 'bg-muted/30 text-muted border-border-light'
    default:
      return 'pending'
  }
}

export function BookingsQueueWidget({ config }: WidgetProps<BookingsQueueConfig>) {
  const { title = 'Bookings', subtitle, stationName, bookings = [] } = config ?? {}
  const effectiveSubtitle = subtitle ?? (stationName ? `Bookings for ${stationName}` : undefined)

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light flex items-start justify-between gap-3">
        <div>
          <div className="card-title">{title}</div>
          {effectiveSubtitle && <div className="text-xs text-muted">{effectiveSubtitle}</div>}
        </div>
        <div className="text-[10px] uppercase font-semibold text-muted">{bookings.length} today</div>
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
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="font-semibold text-text">{b.id}</td>
                <td>
                  <div>{b.customer}</div>
                  <div className="text-xs text-muted">{b.bay}</div>
                </td>
                <td>{b.service}</td>
                <td className="text-sm">{b.time}</td>
                <td>
                  <span className={`pill ${statusClass(b.status)}`}>{b.status}</span>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted text-sm italic">
                  No bookings for this station today.
                </td>
              </tr>
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
