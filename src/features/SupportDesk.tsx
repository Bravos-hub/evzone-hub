import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type TicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed'
type TicketPriority = 'Urgent' | 'High' | 'Normal' | 'Low'

/**
 * Support Desk Page - Admin feature
 */
export function SupportDesk() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'supportDesk')

  const mockTickets = [
    { id: 'TCK-001', subject: 'Cannot start charging', customer: 'john@example.com', priority: 'High' as TicketPriority, status: 'Open' as TicketStatus, created: '30m ago', assignee: 'Support Team' },
    { id: 'TCK-002', subject: 'Billing question', customer: 'jane@company.com', priority: 'Normal' as TicketPriority, status: 'In Progress' as TicketStatus, created: '2h ago', assignee: 'Sarah' },
    { id: 'TCK-003', subject: 'App not loading', customer: 'bob@mail.com', priority: 'Urgent' as TicketPriority, status: 'Waiting' as TicketStatus, created: '1d ago', assignee: 'Tech Support' },
    { id: 'TCK-004', subject: 'Refund request', customer: 'alice@test.com', priority: 'Normal' as TicketPriority, status: 'Resolved' as TicketStatus, created: '3d ago', assignee: 'Billing Team' },
  ]

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All')

  const filtered = useMemo(() => {
    return mockTickets.filter((t) => (statusFilter === 'All' ? true : t.status === statusFilter))
  }, [statusFilter])

  const stats = {
    open: mockTickets.filter((t) => t.status === 'Open').length,
    inProgress: mockTickets.filter((t) => t.status === 'In Progress').length,
    avgResponseTime: '15m',
  }

  function statusColor(s: TicketStatus) {
    switch (s) {
      case 'Open': return 'pending'
      case 'In Progress': return 'bg-accent/20 text-accent'
      case 'Waiting': return 'bg-warn/20 text-warn'
      case 'Resolved': return 'approved'
      case 'Closed': return 'bg-muted/30 text-muted'
    }
  }

  function priorityColor(p: TicketPriority) {
    switch (p) {
      case 'Urgent': return 'bg-danger text-white'
      case 'High': return 'bg-warn text-white'
      case 'Normal': return 'bg-muted/30 text-muted'
      case 'Low': return 'bg-muted/20 text-muted'
    }
  }

  return (
    <DashboardLayout pageTitle="Support Desk">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card"><div className="text-xs text-muted">Open Tickets</div><div className="text-xl font-bold text-warn">{stats.open}</div></div>
        <div className="card"><div className="text-xs text-muted">In Progress</div><div className="text-xl font-bold text-accent">{stats.inProgress}</div></div>
        <div className="card"><div className="text-xs text-muted">Avg Response</div><div className="text-xl font-bold text-ok">{stats.avgResponseTime}</div></div>
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'All')} className="select">
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Waiting">Waiting</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Subject</th>
              <th>Customer</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assignee</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="font-semibold text-text">{t.id}</td>
                <td>{t.subject}</td>
                <td className="text-sm text-muted">{t.customer}</td>
                <td><span className={`pill ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                <td><span className={`pill ${statusColor(t.status)}`}>{t.status}</span></td>
                <td>{t.assignee}</td>
                <td className="text-right">
                  <div className="inline-flex gap-2">
                    <button className="btn secondary" onClick={() => alert(`View ${t.id} (demo)`)}>View</button>
                    {perms.respond && t.status === 'Open' && (
                      <button className="btn secondary" onClick={() => alert(`Reply ${t.id} (demo)`)}>Reply</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

