import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useSites } from '@/modules/sites/hooks/useSites'
import { SiteApplicationForm } from '@/features/SiteApplicationForm'
import { SiteDetail } from '@/features/SiteDetail'

type ListingKind = 'Operators' | 'Sites' | 'Technicians'
type ViewMode = 'LIST' | 'DETAIL' | 'APPLY'

export function Marketplace() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'marketplace' as any)

  const { data: sites = [], isLoading } = useSites()

  const [kind, setKind] = useState<ListingKind | 'All'>('Sites') // Default to Sites as that's our main focus
  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [q, setQ] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('LIST')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  const listings = useMemo(() => {
    // 1. Filter Sites
    const siteListings = sites
      .filter(s => s.purpose === 'COMMERCIAL') // Only Commercial sites
      .map(s => ({
        id: s.id,
        kind: 'Sites' as const,
        name: s.name,
        region: 'AFRICA', // TODO: Add region to Site model
        city: s.city,
        capacity: s.powerCapacityKw,
        rating: 4.5, // Mock rating
        leaseType: s.leaseType,
        price: s.expectedMonthlyPrice,
        footfall: s.expectedFootfall
      }))

    // 2. Mock Operators/Techs (Keep existing mocks for now or remove if not needed)
    const otherListings = [
      { id: 'OP-001', kind: 'Operators', name: 'VoltOps Ltd', region: 'AFRICA', city: 'Kampala', capacity: 200 },
      { id: 'TECH-11', kind: 'Technicians', name: 'AmpCrew Techs', region: 'AFRICA', city: 'Nairobi', skills: ['OCPP', 'HVAC'], rating: 4.7 },
    ] as any[]

    return [...siteListings, ...otherListings]
      .filter((l) => (kind === 'All' ? true : l.kind === kind))
      .filter((l) => (region === 'ALL' ? true : l.region === region))
      .filter((l) => (q ? (l.name + ' ' + l.city).toLowerCase().includes(q.toLowerCase()) : true))
  }, [sites, kind, region, q])

  const handleApply = (siteId: string) => {
    setSelectedSiteId(siteId)
    setViewMode('APPLY')
  }

  const handleView = (siteId: string) => {
    // If we had a full generic detail view, we'd use it. For now, we can maybe reuse SiteDetail if adaptable
    // or just show simple details.
    alert(`View details for ${siteId} (Coming Soon)`)
  }

  if (viewMode === 'APPLY' && selectedSiteId) {
    return (
      <DashboardLayout pageTitle="Apply for Site">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setViewMode('LIST')} className="mb-4 text-sm text-muted hover:text-text flex items-center gap-1">
            ← Back to Marketplace
          </button>
          <SiteApplicationForm siteId={selectedSiteId} onSuccess={() => setViewMode('LIST')} onCancel={() => setViewMode('LIST')} embedded={true} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Marketplace">
      <div className="space-y-4">
        <div className="card grid md:grid-cols-4 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or city" className="input md:col-span-2" />
          <select value={kind} onChange={(e) => setKind(e.target.value as ListingKind | 'All')} className="select">
            {['All', 'Operators', 'Sites', 'Technicians'].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="select">
            {['ALL', 'AFRICA', 'EUROPE', 'AMERICAS', 'ASIA', 'MIDDLE_EAST'].map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All regions' : r}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted">Loading marketplace...</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {listings.map((l) => (
              <div key={l.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted">{l.kind}</div>
                    <div className="text-lg font-bold text-text">{l.name}</div>
                  </div>
                  <span className={`pill ${l.kind === 'Sites' ? 'active' : 'neutral'}`}>{l.kind}</span>
                </div>

                <div className="text-sm text-muted flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {l.city}
                </div>

                {l.kind === 'Sites' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Lease Type</div>
                      <div className="font-semibold capitalize">{(l.leaseType as string)?.replace('_', ' ').toLowerCase() || 'N/A'}</div>
                    </div>
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Price</div>
                      <div className="font-semibold">{l.price ? `$${l.price}/mo` : 'Negotiable'}</div>
                    </div>
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Power</div>
                      <div className="font-semibold">{l.capacity} kW</div>
                    </div>
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Footfall</div>
                      <div className="font-semibold capitalize">{(l.footfall as string)?.toLowerCase() || 'Medium'}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button className="btn secondary flex-1" onClick={() => handleView(l.id)}>
                    Details
                  </button>
                  {l.kind === 'Sites' && (user?.role === 'OWNER' || user?.role === 'EVZONE_OPERATOR') && (
                    <button className="btn primary flex-1" onClick={() => handleApply(l.id)}>
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
