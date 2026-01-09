import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useTenants, useApplications, useUpdateApplicationStatus, useUpdateApplicationTerms } from '@/core/api/hooks/useTenants'
import { getErrorMessage } from '@/core/api/errors'
import { PATHS } from '@/app/router/paths'
import type { Tenant, TenantApplication } from '@/core/api/types'
import { ApplicationDetailModal } from '@/modals'

/* ─────────────────────────────────────────────────────────────────────────────
   Tenants — Site Owner tenant/operator management
   RBAC: Site Owners, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type ViewMode = 'applications' | 'tenants'

export function Tenants() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const role = user?.role ?? 'SITE_OWNER'
  const canView = hasPermission(role, 'tenants', 'view')
  const canEdit = hasPermission(role, 'tenants', 'edit')

  const initialViewMode = searchParams.get('tab') === 'applications' ? 'applications' : 'tenants'
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [site, setSite] = useState('All')
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  const [selectedApp, setSelectedApp] = useState<TenantApplication | null>(null)
  const updateStatus = useUpdateApplicationStatus()
  const updateTerms = useUpdateApplicationTerms()

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  // Fetch applications and tenants
  const { data: applications, isLoading: appsLoading } = useApplications()
  const { data: tenants, isLoading: tenantsLoading } = useTenants()

  const apps = applications || []
  const tnts = tenants || []

  // Handle appId search param to open modal automatically
  useEffect(() => {
    const appId = searchParams.get('appId')
    if (appId && apps.length > 0) {
      const app = apps.find(a => a.id === appId)
      if (app) {
        setSelectedApp(app)
        updateTab('applications')
      }
    }
  }, [searchParams, apps])

  const allSites = useMemo(() => {
    const sites = new Set<string>()
    tnts.forEach(t => sites.add(t.siteName))
    apps.forEach(a => sites.add(a.siteName))
    return Array.from(sites)
  }, [tnts, apps])

  const filtered = useMemo(() => {
    const data = viewMode === 'applications' ? apps : tnts
    return data
      .filter(r => site === 'All' || (viewMode === 'applications' ? (r as TenantApplication).siteName === site : (r as Tenant).siteName === site))
      .filter(r => {
        if (viewMode === 'tenants') return type === 'All' || (r as Tenant).type === type
        return true
      })
      .filter(r => {
        if (viewMode === 'tenants') return status === 'All' || r.status === status
        if (viewMode === 'applications') return status === 'All' || (r as TenantApplication).status === status
        return true
      })
      .filter(r => {
        const searchStr = (r.id + ' ' + (viewMode === 'applications' ? (r as TenantApplication).applicantName : (r as Tenant).name) + ' ' + (viewMode === 'applications' ? (r as TenantApplication).siteName : (r as Tenant).siteName)).toLowerCase()
        return !q || searchStr.includes(q.toLowerCase())
      })
  }, [viewMode, site, type, status, q, tnts, apps])

  const kpis = useMemo(() => {
    if (viewMode === 'applications') {
      return {
        total: filtered.length,
        pending: filtered.filter(a => (a as TenantApplication).status === 'Pending').length,
      }
    }
    return {
      total: filtered.length,
      active: filtered.filter(t => (t as Tenant).status === 'Active').length,
      totalEarnings: filtered.reduce((sum, t) => sum + ((t as Tenant).earnings || 0), 0),
    }
  }, [filtered, viewMode])

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Tenants.</div>
  }

  const updateTab = (tab: ViewMode) => {
    setViewMode(tab)
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    // If we're coming from appId, we might want to clear it when manually switching tabs
    if (tab === 'tenants') next.delete('appId')
    setSearchParams(next, { replace: true })
  }

  const handleUpdateStatus = (id: string, status: 'Approved' | 'Rejected', terms?: any) => {
    const updateAppStatus = () => {
      updateStatus.mutate({ id, status }, {
        onSuccess: () => {
          toast(`Application ${status.toLowerCase()} successfully`)
          setSelectedApp(null)
          // Clear appId from URL if present
          if (searchParams.get('appId')) {
            const next = new URLSearchParams(searchParams)
            next.delete('appId')
            setSearchParams(next, { replace: true })
          }
        },
        onError: (err) => toast(`Error: ${getErrorMessage(err)}`)
      })
    }

    if (status === 'Approved' && terms) {
      updateTerms.mutate({ id, terms }, {
        onSuccess: updateAppStatus,
        onError: (err) => toast(`Error updating terms: ${getErrorMessage(err)}`)
      })
    } else {
      updateAppStatus()
    }
  }

  return (
    <DashboardLayout pageTitle="Site Owner — Tenants">
      <div className="space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => updateTab('tenants')}
            className={`pb-3 px-4 border-b-2 transition-colors ${viewMode === 'tenants'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-muted hover:text-text'
              }`}
          >
            Active Tenants
          </button>
          <button
            onClick={() => updateTab('applications')}
            className={`pb-3 px-4 border-b-2 transition-colors ${viewMode === 'applications'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-muted hover:text-text'
              }`}
          >
            Applications {apps.length > 0 && <span className="ml-1 pill bg-accent/20 text-accent text-xs">{apps.length}</span>}
          </button>
        </div>

        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{viewMode === 'applications' ? 'Total Applications' : 'Total Tenants'}</div>
            <div className="mt-2 text-2xl font-bold">{kpis.total}</div>
          </div>
          {viewMode === 'tenants' && (
            <>
              <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
                <div className="text-sm text-subtle">Active</div>
                <div className="mt-2 text-2xl font-bold">{(kpis as any).active}</div>
              </div>
              <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
                <div className="text-sm text-subtle">Total Earnings</div>
                <div className="mt-2 text-2xl font-bold">${(kpis as any).totalEarnings?.toLocaleString()}</div>
              </div>
            </>
          )}
          {viewMode === 'applications' && (
            <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
              <div className="text-sm text-subtle">Pending</div>
              <div className="mt-2 text-2xl font-bold">{(kpis as any).pending}</div>
            </div>
          )}
        </section>

        {/* Filters */}
        <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-5 gap-3">
          <label className="relative md:col-span-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tenant / site" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
          </label>
          <select value={site} onChange={e => setSite(e.target.value)} className="select">
            <option>All</option>
            {allSites.map(s => <option key={s}>{s}</option>)}
          </select>
          {viewMode === 'tenants' && (
            <select value={type} onChange={e => setType(e.target.value)} className="select">
              {['All', 'Operator', 'Owner', 'Fleet'].map(o => <option key={o}>{o}</option>)}
            </select>
          )}
          <select value={status} onChange={e => setStatus(e.target.value)} className="select">
            {viewMode === 'tenants'
              ? ['All', 'Active', 'Suspended', 'Terminated'].map(o => <option key={o}>{o}</option>)
              : ['All', 'Pending', 'Approved', 'Rejected'].map(o => <option key={o}>{o}</option>)
            }
          </select>
        </section>

        {/* Loading States */}
        {(appsLoading || tenantsLoading) && (
          <div className="text-center py-8 text-muted">Loading...</div>
        )}

        {/* Table */}
        {!appsLoading && !tenantsLoading && (
          <section className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-subtle">
                <tr>
                  <th className="w-24 px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">{viewMode === 'applications' ? 'Applicant' : 'Tenant'}</th>
                  {viewMode === 'tenants' && <th className="w-24 px-4 py-3 text-left font-medium">Type</th>}
                  <th className="px-4 py-3 text-left font-medium">Site</th>
                  {viewMode === 'tenants' && (
                    <>
                      <th className="px-4 py-3 text-left font-medium">Model</th>
                      <th className="w-24 px-4 py-3 text-left font-medium">Terms</th>
                      <th className="w-24 px-4 py-3 text-left font-medium">Start</th>
                      <th className="w-24 px-4 py-3 text-right font-medium">Earnings</th>
                    </>
                  )}
                  {viewMode === 'applications' && (
                    <>
                      <th className="w-32 px-4 py-3 text-left font-medium">Proposed Rent</th>
                      <th className="w-24 px-4 py-3 text-left font-medium">Term</th>
                      <th className="w-24 px-4 py-3 text-left font-medium">Applied</th>
                    </>
                  )}
                  <th className="w-24 px-4 py-3 text-left font-medium">Status</th>
                  {canEdit && <th className="w-24 px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-subtle">
                      No {viewMode === 'applications' ? 'applications' : 'tenants'} match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => {
                    if (viewMode === 'applications') {
                      const app = r as TenantApplication
                      return (
                        <tr key={app.id}>
                          <td className="px-4 py-3 font-mono text-xs">{app.id}</td>
                          <td className="px-4 py-3 font-medium">{app.applicantName}</td>
                          <td className="px-4 py-3">{app.siteName}</td>
                          <td className="px-4 py-3">
                            {app.proposedRent ? `$${app.proposedRent.toLocaleString()}` : 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            {app.proposedTerm ? `${app.proposedTerm} mo` : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-subtle">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3"><StatusPill status={app.status} /></td>
                          {canEdit && (
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button onClick={() => setSelectedApp(app)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Review</button>
                                {app.status === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateStatus(app.id, 'Approved')}
                                      className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs"
                                      disabled={updateStatus.isPending}
                                    >
                                      Approve
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    } else {
                      const tenant = r as Tenant
                      return (
                        <tr key={tenant.id}>
                          <td className="px-4 py-3 font-mono text-xs">{tenant.id}</td>
                          <td className="px-4 py-3 font-medium">{tenant.name}</td>
                          <td className="px-4 py-3 text-xs"><TypePill type={tenant.type} /></td>
                          <td className="px-4 py-3 truncate max-w-[128px]">{tenant.siteName}</td>
                          <td className="px-4 py-3 truncate max-w-[120px]">{tenant.model}</td>
                          <td className="px-4 py-3 text-xs">{tenant.terms}</td>
                          <td className="px-4 py-3 text-xs">{new Date(tenant.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right font-medium">${(tenant.earnings || 0).toLocaleString()}</td>
                          <td className="px-4 py-3"><StatusPill status={tenant.status} /></td>
                          {canEdit && (
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => navigate(PATHS.SITE_OWNER.TENANT_DETAIL(tenant.id))} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Manage</button>
                            </td>
                          )}
                        </tr>
                      )
                    }
                  })
                )}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {selectedApp && (
        <ApplicationDetailModal
          open={!!selectedApp}
          application={selectedApp}
          loading={updateStatus.isPending}
          onCancel={() => {
            setSelectedApp(null)
            if (searchParams.get('appId')) {
              const next = new URLSearchParams(searchParams)
              next.delete('appId')
              setSearchParams(next, { replace: true })
            }
          }}
          onConfirm={handleUpdateStatus}
        />
      )}
    </DashboardLayout>
  )
}

function TypePill({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Operator: 'bg-blue-100 text-blue-700',
    Owner: 'bg-emerald-100 text-emerald-700',
    Fleet: 'bg-amber-100 text-amber-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[type] || 'bg-gray-100 text-gray-600'}`}>{type}</span>
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    Suspended: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    Terminated: 'bg-gray-500/10 text-gray-500 border border-gray-500/20',
    Approved: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    Rejected: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>{status}</span>
}

export default Tenants
