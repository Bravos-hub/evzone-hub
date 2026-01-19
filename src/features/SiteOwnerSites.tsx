import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { regionInScope } from '@/core/scope/utils'
import { useScopeStore } from '@/core/scope/scopeStore'
import { useSites, useCreateSite } from '@/core/api/hooks/useSites'
import { AddSite, type SiteForm } from './AddSite'
import { getErrorMessage } from '@/core/api/errors'
import { auditLogger } from '@/core/utils/auditLogger'
import { PATHS } from '@/app/router/paths'
import type { CreateSiteRequest, SiteFootfall, SiteLeaseType } from '@/core/api/types'

type SiteStatus = 'Draft' | 'Listed' | 'Leased'

type Site = {
  id: string
  name: string
  address: string
  region: string
  status: SiteStatus
  slots: number
  payout: number
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

  return {
    name: form.name.trim(),
    city: form.city.trim(),
    address: form.address.trim(),
    powerCapacityKw: Number.isFinite(powerCapacityKw) ? powerCapacityKw : 0,
    parkingBays: Number.isFinite(parkingBays) ? parkingBays : 0,
    leaseType: LEASE_TYPE_MAP[form.lease] ?? 'REVENUE_SHARE',
    expectedMonthlyPrice: Number.isFinite(expectedMonthlyPrice ?? NaN) ? expectedMonthlyPrice : undefined,
    expectedFootfall: FOOTFALL_MAP[form.footfall] ?? 'MEDIUM',
    latitude: form.latitude ? Number(form.latitude) : undefined,
    longitude: form.longitude ? Number(form.longitude) : undefined,
    amenities: Array.from(form.amenities),
    tags: form.tags,
    ownerId,
  }
}

export function SiteOwnerSites() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'sites')
  const { scope } = useScopeStore()
  const navigate = useNavigate()

  const { data: sitesData, isLoading, error } = useSites()
  const createSiteMutation = useCreateSite()

  const [status, setStatus] = useState<SiteStatus | 'All'>('All')
  const [q, setQ] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Map stations to sites format
  const sites = useMemo(() => {
    if (!sitesData) return []
    return sitesData.map((site) => ({
      id: site.id,
      name: site.name,
      address: site.address,
      region: 'AFRICA',
      status: site.status === 'ACTIVE' ? 'Listed' : site.status === 'INACTIVE' ? 'Draft' : 'Leased' as SiteStatus,
      slots: site.parkingBays,
      payout: Math.floor(Math.random() * 5000),
    }))
  }, [sitesData])

  const rows = useMemo(() => {
    return sites
      .filter((s) => regionInScope(scope, s.region))
      .filter((s) => (status === 'All' ? true : s.status === status))
      .filter((s) => (q ? (s.name + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true))
  }, [sites, status, q, scope])

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
    <DashboardLayout pageTitle="Site Owner — Sites">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Sites</h2>
          {perms.create && (
            <button className="btn" onClick={() => setIsAdding(true)}>
              Add Site
            </button>
          )}
        </div>

        <div className="card grid md:grid-cols-3 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search site/address" className="input md:col-span-2" />
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="select">
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
                  <th className="!text-right">Expected payout</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted">
                      No sites found. {perms.create && <button className="btn secondary mt-2" onClick={() => setIsAdding(true)}>Add your first site</button>}
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold">{s.name}</td>
                      <td className="text-sm text-muted">{s.address}</td>
                      <td>
                        <span
                          className={`pill ${
                            s.status === 'Leased'
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
                      <td className="text-right">${s.payout.toLocaleString()}</td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.SITE_DETAIL(s.id))}>
                            View
                          </button>
                          {perms.edit && (
                            <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.SITE_DETAIL(s.id))}>
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
    </DashboardLayout>
  )
}
