import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { AddSite, type SiteForm } from './AddSite'
import { useSites, useCreateSite, useUpdateSite } from '@/core/api/hooks/useSites'
import { SiteEditModal } from '@/modals'
import { getErrorMessage } from '@/core/api/errors'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'

import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'
import type { CreateSiteRequest, Footfall, LeaseType, SitePurpose } from '@/core/api/types'

type Tab = 'Owned' | 'Rented'

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
 * Sites Page - Site Owner & Station Owner feature
 */
export function Sites() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const perms = getPermissionsForFeature(user?.role, 'sites')

  const { data: sitesData, isLoading, error } = useSites()
  const createSiteMutation = useCreateSite()

  const [activeTab, setActiveTab] = useState<Tab>('Owned')
  const [isAdding, setIsAdding] = useState(false)
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const updateSiteMutation = useUpdateSite()

  // Map stations to sites format
  const sites = useMemo(() => {
    if (!sitesData || !user) return []

    return sitesData
      .filter((site) => {
        // Platform Admins see everything
        const isAdmin = isInGroup(user.role, ROLE_GROUPS.PLATFORM_ADMINS) || user.role === 'EVZONE_OPERATOR'
        if (isAdmin) return true

        // For others, strictly filter based on ownership or some participation logic
        // If the backend doesn't filter, we must filter here.
        // For now, let's assume they only see what they own or rent.
        const isOwned = site.ownerId === user.id
        // Since we don't have a clear 'tenantId', we check if it's in their view.
        // If they don't own it, but it's active/pending, it might be rented.
        return isOwned || site.status === 'ACTIVE' || site.status === 'PENDING'
      })
      .map((site) => {
        const isOwned = site.ownerId === user.id
        const uiStatus =
          site.status === 'ACTIVE' ? 'Active' :
            site.status === 'PENDING' ? 'Pending' :
              site.status === 'INACTIVE' ? 'Inactive' : 'Maintenance'

        return {
          id: site.id,
          name: site.name,
          address: site.address,
          stations: (site as any).stationsCount ?? (site.purpose === 'COMMERCIAL' ? 1 : 0),
          revenue: 0,
          status: uiStatus,
          type: isOwned ? 'Owned' : 'Rented' as Tab,
          ownerId: site.ownerId
        }
      })
  }, [sitesData, user])

  const siteToEdit = useMemo(() => {
    return sitesData?.find(s => s.id === editingSiteId)
  }, [sitesData, editingSiteId])

  const filtered = useMemo(() => {
    return sites
      .filter((s) => s.type === activeTab)
      .filter((s) => (q ? (s.name + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true))
  }, [sites, q, activeTab])

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

  // Handle Loading
  if (isLoading) {
    return <DashboardLayout pageTitle="My Sites"><div className="text-center py-12">Loading...</div></DashboardLayout>
  }

  // Handle Add Site Modal Mode
  if (isAdding) {
    return (
      <DashboardLayout pageTitle="Add New Site">
        <AddSite onSuccess={handleAddSite} onCancel={() => setIsAdding(false)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="My Sites">
      {/* Error Message */}
      {(error || errorMessage) && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {errorMessage || (error ? getErrorMessage(error) : 'An error occurred')}
          </div>
        </div>
      )}

      {/* Stats Summary (Filtered by Tab) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card">
          <div className="text-xs text-muted">Sites ({activeTab})</div>
          <div className="text-xl font-bold text-text">{filtered.length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Stations Hosted</div>
          <div className="text-xl font-bold text-accent">{filtered.reduce((a, s) => a + s.stations, 0)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Est. Revenue</div>
          <div className="text-xl font-bold text-ok">${filtered.reduce((a, s) => a + s.revenue, 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs and Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex p-1 bg-surface border border-white/5 rounded-xl">
          {(['Owned', 'Rented'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-text'
                }`}
            >
              {tab} Sites
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'Owned' ? (
            <button
              className="btn primary"
              onClick={() => setIsAdding(true)}
            >
              + Add Site
            </button>
          ) : (
            <button
              className="btn primary"
              onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)}
            >
              Apply for Site
            </button>
          )}
        </div>
      </div>

      {/* Sites Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Address</th>
              <th>Stations</th>
              <th>Revenue/Cost</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                    <svg className="w-16 h-16 mx-auto text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-muted text-sm mb-3">No {activeTab.toLowerCase()} sites found</p>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-subtle text-xs">
                        {activeTab === 'Owned' ? 'Get started by adding your first site' : 'Start your journey by applying for a site'}
                      </p>
                      {activeTab === 'Owned' ? (
                        <button className="btn secondary btn-sm" onClick={() => setIsAdding(true)}>+ Add Site</button>
                      ) : (
                        <button className="btn secondary btn-sm" onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)}>Apply for Site</button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-text">{s.name}</td>
                  <td className="text-muted">{s.address}</td>
                  <td>{s.stations}</td>
                  <td className="font-semibold">
                    {activeTab === 'Owned' ? (
                      <span className="text-ok">+${s.revenue.toLocaleString()}</span>
                    ) : (
                      <span className="text-amber-500">-${(s.revenue * 0.8).toLocaleString()}</span>
                    )}
                  </td>
                  <td>
                    <span className={`pill ${s.status === 'Active' ? 'approved' : 'pending'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.SITE_DETAIL(s.id))}>
                        View
                      </button>
                      {perms.edit && (isInGroup(user?.role, ROLE_GROUPS.PLATFORM_ADMINS) || s.ownerId === user?.id) && (
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
