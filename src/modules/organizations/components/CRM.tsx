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

  /* import { CRM } ... */
  import { useCrmStats, useCustomers } from '../hooks/useCrm'

  /**
   * CRM Page - Admin feature
   */
  export function CRM() {
    const { user } = useAuthStore()
    const perms = getPermissionsForFeature(user?.role, 'crm')

    const { data: statsData } = useCrmStats()
    const { data: customersData, isLoading } = useCustomers()

    // Fallback if data loading
    const customers = customersData || []
    const stats = statsData || { total: 0, active: 0, totalRevenue: 0 }

    const [q, setQ] = useState('')
    const [typeFilter, setTypeFilter] = useState<CustomerType | 'All'>('All')

    const filtered = useMemo(() => {
      return customers
        .filter((c: any) => (q ? (c.name + ' ' + c.email).toLowerCase().includes(q.toLowerCase()) : true))
      //.filter((c: any) => (typeFilter === 'All' ? true : c.type === typeFilter)) // Type might be missing on real data yet
    }, [q, typeFilter, customers])


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
}

