import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { AddSite, type SiteForm } from './AddSite'
import { useSites, useCreateSite, useUpdateSite } from '@/modules/sites/hooks/useSites'
import { useApplications, useUpdateApplicationStatus } from '@/modules/applications/hooks/useApplications'
import { useTenantSites } from '@/modules/tenants/hooks/useTenantDashboard'
import { SiteEditModal, ApplicationDetailModal } from '@/modals'
import { getErrorMessage } from '@/core/api/errors'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'

import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import type { CreateSiteRequest, Footfall, LeaseType, SitePurpose } from '@/core/api/types'
import type { Application } from '@/modules/applications/types'

type Tab = 'Owned' | 'Rented' | 'Applications' | 'Tenants'

const LEASE_TYPE_MAP: Record<string, LeaseType> = {
  'Revenue share': 'REVENUE_SHARE',
  'Fixed rent': 'FIXED_RENT',
  Hybrid: 'HYBRID',
}

const FOOTFALL_MAP: Record<string, Footfall> = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  'Very high': 'VERY_HIGH',
}

const PURPOSE_MAP: Record<string, SitePurpose> = {
  Personal: 'PERSONAL',
  Commercial: 'COMMERCIAL',
}

function mapSiteFormToRequest(form: SiteForm, ownerId?: string): CreateSiteRequest {
  const powerCapacityKw = Number(form.power)
  const parkingBays = Number(form.bays)
  const expectedMonthlyPrice = form.monthlyPrice ? Number(form.monthlyPrice) : undefined
  const purpose = PURPOSE_MAP[form.purpose] ?? 'COMMERCIAL'
  const isCommercial = purpose === 'COMMERCIAL'

  return {
    name: form.name.trim(),
    city: form.city.trim(),
    address: form.address.trim(),
    powerCapacityKw: Number.isFinite(powerCapacityKw) ? powerCapacityKw : 0,
    parkingBays: Number.isFinite(parkingBays) ? parkingBays : 0,
    purpose,
    leaseType: isCommercial ? (LEASE_TYPE_MAP[form.lease] ?? 'REVENUE_SHARE') : undefined,
    expectedMonthlyPrice: isCommercial && Number.isFinite(expectedMonthlyPrice ?? NaN) ? expectedMonthlyPrice : undefined,
    expectedFootfall: isCommercial ? (FOOTFALL_MAP[form.footfall] ?? 'MEDIUM') : undefined,
    latitude: form.latitude ? Number(form.latitude) : undefined,
    longitude: form.longitude ? Number(form.longitude) : undefined,
    amenities: Array.from(form.amenities),
    tags: form.tags,
    ownerId: form.ownerId || ownerId,
  }
}

/**
 * Sites Page - Unified Site Management
 * Handles Site Owner (Landlord) and Station Owner (Tenant) views
 */
export function Sites() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const perms = getPermissionsForFeature(user?.role, 'sites')

  // DATA HOOKS
  const { data: sitesData, isLoading: loadingSites, error: sitesError } = useSites()
  const { data: leasedSitesData, isLoading: loadingLeased } = useTenantSites()
  const { data: applicationsData, isLoading: loadingApps } = useApplications()

  // MUTATIONS
  const createSiteMutation = useCreateSite()
  const updateSiteMutation = useUpdateSite()
  const updateAppStatus = useUpdateApplicationStatus()

  // STATE
  const [activeTab, setActiveTab] = useState<Tab>('Owned')
  const [isAdding, setIsAdding] = useState(false)
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [q, setQ] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [ack, setAck] = useState('')

  const isSiteOwner = user?.role === 'SITE_OWNER' || isInGroup(user?.role, ROLE_GROUPS.PLATFORM_ADMINS)
  const isStationOwner = user?.role === 'OWNER' || user?.role === 'EVZONE_OPERATOR' // Station Owner is mapped to 'OWNER' role

  // Determine available tabs
  const availableTabs = useMemo(() => {
    const tabs: Tab[] = []
    if (isSiteOwner) {
      tabs.push('Owned')
      tabs.push('Applications')
      tabs.push('Tenants')
    }

    // Station owners can now manage their own "Personal" sites
    if (isStationOwner) {
      tabs.push('Owned')
    }

    // Station owners might also rent sites, so 'Rented' is valid if they have any
    if (isStationOwner || (!isSiteOwner && leasedSitesData?.length > 0)) {
      tabs.push('Rented')
    }
    // Default fallback if no role matches specific logic but data exists
    if (tabs.length === 0) tabs.push('Owned')
    return Array.from(new Set(tabs))
  }, [isSiteOwner, isStationOwner, leasedSitesData])

  // Reset tab if current tab is not available
  useMemo(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
  }, [availableTabs, activeTab])


  // PROCESSED DATA
  // 1. Owned Sites
  const ownedSites = useMemo(() => {
    if (!sitesData || !user) return []
    return sitesData
      .filter((site) => {
        const isAdmin = isInGroup(user.role, ROLE_GROUPS.PLATFORM_ADMINS)
        if (isAdmin) return true
        return site.ownerId === user.id
      })
      .map((site) => ({
        ...site,
        uiStatus: site.status === 'ACTIVE' ? 'Active' :
          site.status === 'PENDING' ? 'Pending' :
            site.status === 'INACTIVE' ? 'Inactive' : 'Maintenance',
        stationsCount: (site as any).stationsCount ?? (site.purpose === 'COMMERCIAL' ? 1 : 0),
        market_revenue: 0 // Placeholder
      }))
  }, [sitesData, user])

  // 2. Leased Sites (for Station Owners)
  // already formatted by useTenantSites

  // 3. Applications (for Site Owners)
  const myApplications = useMemo(() => {
    if (!applicationsData || !user || !ownedSites) return []
    const mySiteIds = ownedSites.map(s => s.id)
    return applicationsData.filter(app => mySiteIds.includes(app.siteId))
  }, [applicationsData, user, ownedSites])

  // 4. Tenants (Approved Applications)
  const myTenants = useMemo(() => {
    return myApplications.filter(app => app.status === 'APPROVED')
  }, [myApplications])

  // Filter for display
  const filteredOwned = useMemo(() => ownedSites.filter(s => q ? (s.name + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true), [ownedSites, q])
  const filteredLeased = useMemo(() => (leasedSitesData || []).filter(s => q ? (s.siteName + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true), [leasedSitesData, q])
  const filteredApps = useMemo(() => myApplications.filter(a => q ? (a.operator?.name + ' ' + a.site?.name).toLowerCase().includes(q.toLowerCase()) : true), [myApplications, q])
  const filteredTenants = useMemo(() => myTenants.filter(t => q ? (t.operator?.name + ' ' + t.site?.name).toLowerCase().includes(q.toLowerCase()) : true), [myTenants, q])


  const handleAddSite = async (newSite: SiteForm) => {
    try {
      if (!user?.id) {
        setErrorMessage('Missing ownerId for site creation.')
        return
      }
      const site = await createSiteMutation.mutateAsync(mapSiteFormToRequest(newSite, user.id))
      const { auditLogger } = await import('@/core/utils/auditLogger')
      auditLogger.stationCreated(site.id, site.name)
      setIsAdding(false)
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    }
  }

  const handleUpdateAppStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    updateAppStatus.mutate({ id, data: { status } }, {
      onSuccess: () => {
        setAck(`Application ${status.toLowerCase()} successfully`)
        setTimeout(() => setAck(''), 3000)
        setSelectedApp(null)
      },
      onError: (err) => setErrorMessage(getErrorMessage(err))
    })
  }

  // Handle Loading
  if (loadingSites || (isStationOwner && loadingLeased) || (isSiteOwner && loadingApps)) {
    return <DashboardLayout pageTitle="Property Management"><div className="text-center py-12">Loading...</div></DashboardLayout>
  }

  if (isAdding) {
    return (
      <DashboardLayout pageTitle="Add New Site">
        <AddSite onSuccess={handleAddSite} onCancel={() => setIsAdding(false)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Property Management">
      <div className="space-y-6">
        {/* Error / Ack Messages */}
        {(sitesError || errorMessage || ack) && (
          <div className={`card mb-4 border ${ack ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-sm ${ack ? 'text-emerald-700' : 'text-red-700'}`}>
              {ack || errorMessage || (sitesError ? getErrorMessage(sitesError) : 'An error occurred')}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeTab === 'Owned' && (
            <>
              <StatCard label="My Sites" value={ownedSites.length} />
              <StatCard label="Total Capacity" value={ownedSites.reduce((a, s) => a + s.parkingBays, 0)} sub="Parking Bays" />
              <StatCard label="Est. Revenue" value={`$${ownedSites.reduce((a, s) => a + s.market_revenue, 0).toLocaleString()}`} sub="Monthly" />
            </>
          )}
          {activeTab === 'Rented' && (
            <>
              <StatCard label="Leased Sites" value={leasedSitesData?.length || 0} />
              <StatCard label="Active Stations" value={leasedSitesData?.reduce((a, s) => a + s.stations.filter(st => st.status === 'ACTIVE').length, 0) || 0} />
              <StatCard label="My Revenue" value={`$${leasedSitesData?.reduce((a, s) => a + s.revenue, 0).toLocaleString()}`} />
            </>
          )}
          {activeTab === 'Applications' && (
            <>
              <StatCard label="Pending Review" value={myApplications.filter(a => a.status === 'PENDING_REVIEW').length} />
              <StatCard label="Total Received" value={myApplications.length} />
              <StatCard label="Approval Rate" value={`${Math.round((myApplications.filter(a => a.status === 'APPROVED').length / (myApplications.length || 1)) * 100)}%`} />
            </>
          )}
          {activeTab === 'Tenants' && (
            <>
              <StatCard label="Active Tenants" value={myTenants.length} />
              <StatCard label="Total Earnings" value={`$${myTenants.reduce((sum, t) => sum + (t.negotiatedTerms?.monthlyRent || t.proposedTerms?.monthlyRent || 0), 0).toLocaleString()}`} />
              <StatCard label="Occupancy" value={`${Math.round((myTenants.length / (ownedSites.length || 1)) * 100)}%`} />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-surface border border-border rounded-lg p-1">
            {availableTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-text'
                  }`}
              >
                {tab === 'Owned' ? 'My Sites' : tab === 'Rented' ? 'Leased Sites' : tab}
                {/* Badge for counts */}
                {tab === 'Applications' && myApplications.filter(a => a.status === 'PENDING_REVIEW').length > 0 && (
                  <span className="ml-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {myApplications.filter(a => a.status === 'PENDING_REVIEW').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <input
              className="input w-full sm:w-64"
              placeholder="Search..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            {activeTab === 'Owned' && perms.create && (
              <button className="btn primary whitespace-nowrap" onClick={() => setIsAdding(true)}>+ Add Site</button>
            )}
            {activeTab === 'Rented' && (
              <button className="btn primary whitespace-nowrap" onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)}>Browse Sites</button>
            )}
          </div>
        </div>

        {/* Content Views */}
        <div className="table-wrap">
          {activeTab === 'Owned' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Site Name</th>
                  <th>Address</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOwned.length === 0 ? <EmptyRow message="No sites found" /> : filteredOwned.map(site => (
                  <tr key={site.id}>
                    <td className="font-semibold">{site.name}</td>
                    <td className="text-muted text-sm">{site.address}</td>
                    <td>{site.parkingBays} Bays</td>
                    <td><StatusPill status={site.uiStatus} /></td>
                    <td className="text-right">
                      <button className="btn secondary btn-sm" onClick={() => navigate(PATHS.SITE_OWNER.SITE_DETAIL(site.id))}>View</button>
                      {perms.edit && <button className="btn secondary btn-sm ml-2" onClick={() => setEditingSiteId(site.id)}>Edit</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'Rented' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Site Name</th>
                  <th>Address</th>
                  <th>Stations</th>
                  <th>Lease Status</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeased.length === 0 ? <EmptyRow message="No leased sites found" /> : filteredLeased.map(site => (
                  <tr key={site.siteId}>
                    <td className="font-semibold">{site.siteName}</td>
                    <td className="text-muted text-sm">{site.address}</td>
                    <td>{site.stations.length} Units</td>
                    <td><StatusPill status={site.leaseStatus} /></td>
                    <td className="text-right font-mono text-ok">${site.revenue.toLocaleString()}</td>
                    <td className="text-right">
                      <button className="btn secondary btn-sm" onClick={() => navigate(PATHS.STATIONS.ROOT)}>Manage Stations</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'Applications' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Site</th>
                  <th>Proposed Rent</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.length === 0 ? <EmptyRow message="No applications found" /> : filteredApps.map(app => (
                  <tr key={app.id}>
                    <td className="font-semibold">{app.operator?.name || 'Unknown Operator'}</td>
                    <td>{app.site?.name || 'Unknown Site'}</td>
                    <td>${app.proposedTerms?.monthlyRent?.toLocaleString() || 0}/mo</td>
                    <td className="text-sm text-muted">{new Date(app.submittedAt || Date.now()).toLocaleDateString()}</td>
                    <td><StatusPill status={app.status} /></td>
                    <td className="text-right">
                      <button className="btn secondary btn-sm" onClick={() => setSelectedApp(app)}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'Tenants' && (
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Site</th>
                  <th>Rent</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? <EmptyRow message="No tenants found" /> : filteredTenants.map(t => (
                  <tr key={t.id}>
                    <td className="font-semibold">{t.operator?.name}</td>
                    <td>{t.site?.name}</td>
                    <td>${t.negotiatedTerms?.monthlyRent?.toLocaleString() || t.proposedTerms?.monthlyRent?.toLocaleString() || 0}/mo</td>
                    <td className="text-sm text-muted">{new Date(t.leaseStartDate || Date.now()).toLocaleDateString()}</td>
                    <td><StatusPill status={'Active'} /></td>
                    <td className="text-right">
                      <button className="btn secondary btn-sm" onClick={() => navigate(PATHS.SITE_OWNER.TENANT_DETAIL(t.id))}>Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {editingSiteId && (
        <SiteEditModal
          open={!!editingSiteId}
          site={ownedSites.find(s => s.id === editingSiteId)!}
          loading={updateSiteMutation.isPending}
          onCancel={() => setEditingSiteId(null)}
          onConfirm={(data) => {
            updateSiteMutation.mutate({ id: editingSiteId, data }, {
              onSuccess: () => setEditingSiteId(null)
            })
          }}
        />
      )}

      {selectedApp && (
        <ApplicationDetailModal
          open={!!selectedApp}
          application={selectedApp}
          loading={updateAppStatus.isPending}
          onCancel={() => setSelectedApp(null)}
          onConfirm={handleUpdateAppStatus}
        />
      )}
    </DashboardLayout>
  )
}

// Helpers
function StatCard({ label, value, sub }: { label: string, value: string | number, sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase text-muted mb-1">{label}</div>
      <div className="text-2xl font-bold text-text">{value}</div>
      {sub && <div className="text-xs text-subtle mt-1">{sub}</div>}
    </div>
  )
}

function EmptyRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={10} className="p-8 text-center text-muted border-dashed border-2 border-border/50 rounded-lg">
        {message}
      </td>
    </tr>
  )
}

function StatusPill({ status }: { status: string }) {
  const clean = status.replace(/_/g, ' ')
  const color =
    ['Active', 'APPROVED', 'LEASE_SIGNED'].includes(status) ? 'approved' :
      ['REJECTED', 'SUSPENDED', 'Inactive'].includes(status) ? 'rejected' :
        'pending'
  return <span className={`pill ${color}`}>{clean}</span>
}
