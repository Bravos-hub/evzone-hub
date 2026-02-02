import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useCrmStats, useCustomers } from '@/modules/organizations/hooks/useCrm'
import { getErrorMessage } from '@/core/api/errors'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

type CustomerType = 'Individual' | 'Business' | 'Fleet'
type CustomerStatus = 'Active' | 'Inactive' | 'Churned'

type CustomerRow = {
  id: string
  name: string
  email: string
  type: CustomerType
  status: CustomerStatus
  sessions: number
  revenue: number
  lastActive: string
}

/**
 * CRM Page - Admin feature
 */
export function CRM() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'crm')

  const { data: statsData, isLoading: statsLoading, error: statsError } = useCrmStats()
  const { data: customersData, isLoading: customersLoading, error: customersError } = useCustomers()

  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState<CustomerType | 'All'>('All')

  const customers = useMemo<CustomerRow[]>(() => {
    const raw = Array.isArray(customersData) ? customersData : []
    return raw.map((c: any) => ({
      id: c.id ?? c.userId ?? c.email ?? '—',
      name: c.name ?? c.fullName ?? 'Unknown',
      email: c.email ?? '',
      type: (c.type ?? c.customerType ?? 'Individual') as CustomerType,
      status: (c.status ?? 'Active') as CustomerStatus,
      sessions: Number(c.sessions ?? c.totalSessions ?? 0),
      revenue: Number(c.revenue ?? c.totalRevenue ?? 0),
      lastActive: c.lastActive ?? c.lastSeen ?? '—',
    }))
  }, [customersData])

  const filtered = useMemo(() => {
    return customers
      .filter((c) => (q ? (c.name + ' ' + c.email).toLowerCase().includes(q.toLowerCase()) : true))
      .filter((c) => (typeFilter === 'All' ? true : c.type === typeFilter))
  }, [customers, q, typeFilter])

  const stats = useMemo(() => ({
    total: statsData?.total ?? customers.length,
    active: statsData?.active ?? customers.filter((c) => c.status === 'Active').length,
    totalRevenue: statsData?.totalRevenue ?? customers.reduce((a, c) => a + c.revenue, 0),
  }), [statsData, customers])

  return (
    <DashboardLayout pageTitle="CRM">
      {(statsError || customersError) && (
        <div className="card mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {getErrorMessage(statsError || customersError)}
        </div>
      )}

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
        {(statsLoading || customersLoading) && (
          <div className="p-8">
            <TextSkeleton lines={2} centered />
          </div>
        )}
        {!statsLoading && !customersLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-subtle">No customers found.</div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default CRM
