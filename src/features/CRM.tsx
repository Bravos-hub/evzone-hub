import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type CustomerType = 'Individual' | 'Business' | 'Fleet'
type CustomerStatus = 'Active' | 'Inactive' | 'Churned'

/**
 * CRM Page - Admin feature
 */
export function CRM() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'crm')

  const mockCustomers = [
    { id: 'CUS-001', name: 'John Doe', email: 'john@example.com', type: 'Individual' as CustomerType, status: 'Active' as CustomerStatus, sessions: 45, revenue: 450, lastActive: '2h ago' },
    { id: 'CUS-002', name: 'Acme Corp', email: 'fleet@acme.com', type: 'Fleet' as CustomerType, status: 'Active' as CustomerStatus, sessions: 1250, revenue: 12500, lastActive: '30m ago' },
    { id: 'CUS-003', name: 'Jane Smith', email: 'jane@mail.com', type: 'Individual' as CustomerType, status: 'Inactive' as CustomerStatus, sessions: 12, revenue: 120, lastActive: '30d ago' },
    { id: 'CUS-004', name: 'TechCo Ltd', email: 'info@techco.com', type: 'Business' as CustomerType, status: 'Active' as CustomerStatus, sessions: 320, revenue: 3200, lastActive: '1d ago' },
  ]

  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'All'>('All')

  const filtered = useMemo(() => {
    return mockCustomers
      .filter((c) => (q ? (c.name + ' ' + c.email).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((c) => (typeFilter === 'All' ? true : c.type === typeFilter))
  }, [q, typeFilter])

  const stats = {
    total: mockCustomers.length,
    active: mockCustomers.filter((c) => c.status === 'Active').length,
    totalRevenue: mockCustomers.reduce((a, c) => a + c.revenue, 0),
  }

  return (
    <DashboardLayout pageTitle="CRM">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card"><div className="text-xs text-muted">Total Customers</div><div className="text-xl font-bold text-text">{stats.total}</div></div>
        <div className="card"><div className="text-xs text-muted">Active</div><div className="text-xl font-bold text-ok">{stats.active}</div></div>
        <div className="card"><div className="text-xs text-muted">Total Revenue</div><div className="text-xl font-bold text-accent">${stats.totalRevenue.toLocaleString()}</div></div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers" className="input flex-1" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as CustomerType | 'All')} className="select">
            <option value="All">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Business">Business</option>
            <option value="Fleet">Fleet</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Sessions</th>
              <th>Revenue</th>
              <th>Last Active</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold text-text">{c.name}</td>
                <td className="text-muted">{c.email}</td>
                <td><span className="chip">{c.type}</span></td>
                <td><span className={`pill ${c.status === 'Active' ? 'approved' : c.status === 'Inactive' ? 'pending' : 'rejected'}`}>{c.status}</span></td>
                <td>{c.sessions}</td>
                <td className="font-semibold">${c.revenue.toLocaleString()}</td>
                <td className="text-sm text-muted">{c.lastActive}</td>
                <td className="text-right">
                  <button className="btn secondary" onClick={() => alert(`View ${c.id} (demo)`)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}

