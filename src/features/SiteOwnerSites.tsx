import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { regionInScope } from '@/core/scope/utils'
import { useScopeStore } from '@/core/scope/scopeStore'
import { useSites, useCreateSite, useUpdateSite } from '@/modules/sites/hooks/useSites'
import { useApplications } from '@/modules/applications/hooks/useApplications'
import { AddSite, type SiteForm } from './AddSite'
import { SiteEditModal } from '@/modals'
import { getErrorMessage } from '@/core/api/errors'
import { auditLogger } from '@/core/utils/auditLogger'
import { PATHS } from '@/app/router/paths'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'
import type { CreateSiteRequest, SiteFootfall, SiteLeaseType } from '@/core/api/types'

type SiteStatus = 'Draft' | 'Listed' | 'Leased'
type Tab = 'sites' | 'applications' | 'tenants'

type Site = {
  id: string
  name: string
  address: string
  region: string
  status: SiteStatus
  slots: number
  payout: number
  ownerId?: string
}

const LEASE_TYPE_MAP: Record<string, SiteLeaseType> = {
  'Revenue share': 'REVENUE_SHARE',
  'Fixed rent': 'FIXED_RENT',
  Hybrid: 'HYBRID',
}

const FOOTFALL_MAP: Record<string, SiteFootfall> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  'Very high': 'VERY_HIGH',
}

function mapSiteFormToRequest(form: SiteForm, ownerId?: string): CreateSiteRequest {
  const powerCapacityKw = Number(form.power)
  const parkingBays = Number(form.bays)
  const expectedMonthlyPrice = form.monthlyPrice ? Number(form.monthlyPrice) : undefined
  const purpose = (form.purpose === 'Commercial' ? 'COMMERCIAL' : 'PERSONAL') as 'COMMERCIAL' | 'PERSONAL'
  const isCommercial = purpose === 'COMMERCIAL'

  const requestData: CreateSiteRequest = {
    name: form.name.trim(),
    city: form.city.trim(),
    address: form.address.trim(),
    powerCapacityKw: Number.isFinite(powerCapacityKw) ? powerCapacityKw : 0,
    parkingBays: Number.isFinite(parkingBays) ? parkingBays : 0,
    purpose,
    latitude: form.latitude ? Number(form.latitude) : undefined,
    longitude: form.longitude ? Number(form.longitude) : undefined,
    amenities: Array.from(form.amenities),
    tags: form.tags,
    photos: form.photoUrls,
    ownerId: form.ownerId || ownerId || '',
  }

  // Add leaseDetails if commercial purpose
  if (isCommercial) {
    requestData.leaseDetails = {
      leaseType: LEASE_TYPE_MAP[form.lease] ?? 'REVENUE_SHARE',
      expectedMonthlyPrice: Number.isFinite(expectedMonthlyPrice ?? NaN) ? expectedMonthlyPrice : undefined,
      expectedFootfall: FOOTFALL_MAP[form.footfall] ?? 'MEDIUM',
    }
  }

  return requestData
}

export function SiteOwnerSites() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'sites')
  const { scope } = useScopeStore()
  const navigate = useNavigate()

  const { data: sitesData, isLoading, error } = useSites()
  const { data: applicationsData, isLoading: applicationsLoading } = useApplications()
  const createSiteMutation = useCreateSite()
  const updateSiteMutation = useUpdateSite()

  const [activeTab, setActiveTab] = useState<Tab>('sites')
  const [status, setStatus] = useState<SiteStatus | 'All'>('All')
  const [q, setQ] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Filter sites owned by this user
  const mySites = useMemo(() => {
    if (!sitesData || !user) return []

    return sitesData
      .filter((site) => {
        // Site Owner only sees their own properties
        return site.ownerId === user.id
      })
      .map((site) => ({
        id: site.id,
        name: site.name,
        address: site.address,
        region: 'AFRICA',
        status: site.status === 'ACTIVE' ? 'Listed' : site.status === 'INACTIVE' ? 'Draft' : 'Leased' as SiteStatus,
        slots: site.parkingBays,
        payout: Math.floor(Math.random() * 5000),
        ownerId: site.ownerId
      }))
  }, [sitesData, user])

  // Applications for sites owned by this user
  const myApplications = useMemo(() => {
    if (!applicationsData || !user || !sitesData) return []

    const mySiteIds = sitesData
      .filter(site => site.ownerId === user.id)
      .map(site => site.id)

    return applicationsData.filter(app =>
      mySiteIds.includes(app.siteId)
    )
  }, [applicationsData, user, sitesData])

  // Active tenants (approved applications)
  const myTenants = useMemo(() => {
    return myApplications.filter(app => app.status === 'APPROVED')
  }, [myApplications])

  const siteToEdit = useMemo(() => {
    return sitesData?.find(s => s.id === editingSiteId)
  }, [sitesData, editingSiteId])

  const filteredSites = useMemo(() => {
    return mySites
      .filter((s) => regionInScope(scope, s.region))
      .filter((s) => (status === 'All' ? true : s.status === status))
      .filter((s) => (q ? (s.name + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true))
  }, [mySites, status, q, scope])

  const handleAddSite = async (newSite: SiteForm) => {
    try {
      setErrorMessage('')
      if (!user?.id) {
        setErrorMessage('Missing ownerId for site creation.')
        return
      }
      const site = await createSiteMutation.mutateAsync(mapSiteFormToRequest(newSite, user.id))
      auditLogger.stationCreated(site.id, site.name)
      setIsAdding(false)
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    }
  }

  if (isAdding) {
    return (
      <DashboardLayout pageTitle="Add New Site" contentClassName="p-0 bg-surface">
        <div className="h-full">
          <AddSite
            onSuccess={handleAddSite}
            onCancel={() => setIsAdding(false)}
            fullBleed
          />
        </div>
        {errorMessage && (
          <div className="mt-4 p-3 bg-danger/10 text-danger rounded-lg text-sm">
            {errorMessage}
          </div>
        )}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Site Owner — My Properties">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Property Management</h2>
          {activeTab === 'sites' && perms.create && (
            <button className="btn" onClick={() => setIsAdding(true)}>
              + List New Site
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'sites'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-muted hover:text-text'
              }`}
          >
            My Sites ({mySites.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'applications'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-muted hover:text-text'
              }`}
          >
            Applications ({myApplications.length})
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'tenants'
              ? 'border-accent text-accent font-medium'
              : 'border-transparent text-muted hover:text-text'
              }`}
          >
            Active Tenants ({myTenants.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'sites' && (
          <div className="space-y-4">
            <div className="card grid md:grid-cols-3 gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search site/address"
                className="input md:col-span-2"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="select"
              >
                {['All', 'Draft', 'Listed', 'Leased'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {isLoading && <div className="text-center py-8 text-muted">Loading sites...</div>}
            {error && <div className="p-3 bg-danger/10 text-danger rounded-lg text-sm">{getErrorMessage(error)}</div>}

            {!isLoading && !error && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Slots</th>
                      <th className="!text-right">Expected Revenue</th>
                      <th className="!text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSites.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4">
                          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                            <svg className="w-16 h-16 mx-auto text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className="text-muted text-sm mb-3">No sites listed yet</p>
                            {perms.create && (
                              <div className="flex flex-col items-center gap-2">
                                <p className="text-subtle text-xs">Start earning by listing your first property</p>
                                <button className="btn secondary btn-sm" onClick={() => setIsAdding(true)}>
                                  + List Your First Site
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSites.map((s) => (
                        <tr key={s.id}>
                          <td className="font-semibold">{s.name}</td>
                          <td className="text-sm text-muted">{s.address}</td>
                          <td>
                            <span
                              className={`pill ${s.status === 'Leased'
                                ? 'approved'
                                : s.status === 'Listed'
                                  ? 'pending'
                                  : 'bg-muted/30 text-muted'
                                }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td>{s.slots}</td>
                          <td className="text-right">${s.payout.toLocaleString()}/mo</td>
                          <td className="text-right">
                            <div className="inline-flex gap-2">
                              <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.SITE_DETAIL(s.id))}>
                                View
                              </button>
                              {perms.edit && (
                                <button className="btn secondary" onClick={() => setEditingSiteId(s.id)}>
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-4">
            {applicationsLoading ? (
              <div className="text-center py-8 text-muted">Loading applications...</div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                <svg className="w-16 h-16 mx-auto text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-muted text-sm">No applications received yet</p>
                <p className="text-subtle text-xs mt-1">Applications from operators will appear here</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Site</th>
                      <th>Proposed Terms</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th className="!text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myApplications.map((app) => (
                      <tr key={app.id}>
                        <td className="font-semibold">{app.operator?.name || 'N/A'}</td>
                        <td className="text-sm">{app.site?.name || 'Unknown Site'}</td>
                        <td className="text-sm">
                          {app.proposedTerms
                            ? `$${app.proposedTerms.monthlyRent}/mo (` + app.proposedTerms.leaseDuration + 'm)'
                            : 'N/A'}
                        </td>
                        <td>
                          <span className={`pill ${app.status === 'APPROVED' ? 'approved' :
                            app.status === 'REJECTED' ? 'bg-danger/20 text-danger' :
                              'pending'
                            }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-sm text-muted">
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="text-right">
                          <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.APPLICATION_DETAIL(app.id))}>
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-4">
            {myTenants.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                <svg className="w-16 h-16 mx-auto text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-muted text-sm">No active tenants yet</p>
                <p className="text-subtle text-xs mt-1">Approved operators leasing your sites will appear here</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Site</th>
                      <th>Lease Terms</th>
                      <th>Start Date</th>
                      <th>Monthly Revenue</th>
                      <th className="!text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTenants.map((tenant) => (
                      <tr key={tenant.id}>
                        <td className="font-semibold">{tenant.operator?.name || 'N/A'}</td>
                        <td className="text-sm">{tenant.site?.name || 'Unknown Site'}</td>
                        <td className="text-sm">
                          {tenant.negotiatedTerms
                            ? `$${tenant.negotiatedTerms.monthlyRent}/mo`
                            : (tenant.proposedTerms ? `$${tenant.proposedTerms.monthlyRent}/mo` : 'N/A')}
                        </td>
                        <td className="text-sm text-muted">
                          {tenant.leaseStartDate ? new Date(tenant.leaseStartDate).toLocaleDateString() : 'Pending'}
                        </td>
                        <td className="font-semibold text-emerald-600">$4,500</td>
                        <td className="text-right">
                          <button className="btn secondary" onClick={() => navigate(`/site-owner/tenants/${tenant.id}`)}>
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {siteToEdit && (
        <SiteEditModal
          open={!!editingSiteId}
          site={siteToEdit}
          loading={updateSiteMutation.isPending}
          onCancel={() => setEditingSiteId(null)}
          onConfirm={(data) => {
            updateSiteMutation.mutate({ id: siteToEdit.id, data }, {
              onSuccess: () => setEditingSiteId(null)
            })
          }}
        />
      )}
    </DashboardLayout>
  )
}

