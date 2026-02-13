import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import { SiteApplicationForm } from '@/features/SiteApplicationForm'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import { MarketplaceDetailsDrawer } from '@/features/marketplace/components/MarketplaceDetailsDrawer'
import type { Site, User } from '@/core/api/types'
import type { MarketplaceSummaryListing } from '@/features/marketplace/types'

type ListingKind = 'Operators' | 'Sites' | 'Technicians'
type ViewMode = 'LIST' | 'APPLY'

type BaseListing = MarketplaceSummaryListing

type SiteListing = BaseListing & {
  kind: 'Sites'
  powerCapacityKw: number
  leaseType?: string
  expectedMonthlyPrice?: number
  expectedFootfall?: string
  owner?: Site['owner']
}

type PeopleListing = BaseListing & {
  kind: 'Operators' | 'Technicians'
  email?: string
  phone?: string
  role: User['role']
}

type MarketplaceListing = SiteListing | PeopleListing

const normalizeRegion = (value?: string | null) =>
  value && value.trim() ? value.trim().toUpperCase().replace(/\s+/g, '_') : 'UNKNOWN'

const humanizeRegion = (value: string) =>
  value === 'ALL' ? 'All regions' : value.replace(/_/g, ' ')

const isSiteListing = (listing: MarketplaceListing): listing is SiteListing => listing.kind === 'Sites'

export function Marketplace() {
  const { user } = useAuthStore()
  const canApplyToSite = user?.role === 'STATION_OWNER' || user?.role === 'EVZONE_OPERATOR'

  const { data: sites = [], isLoading: sitesLoading } = useSites({ purpose: 'COMMERCIAL' })
  const { data: operators = [], isLoading: operatorsLoading } = useUsers({
    role: 'STATION_OPERATOR',
    status: 'Active',
  })
  const { data: technicians = [], isLoading: techniciansLoading } = useUsers({
    role: 'TECHNICIAN_PUBLIC',
    status: 'Active',
  })

  const [kind, setKind] = useState<ListingKind | 'All'>('Sites')
  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [q, setQ] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('LIST')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<MarketplaceSummaryListing | null>(null)

  const listings = useMemo<MarketplaceListing[]>(() => {
    const siteListings: SiteListing[] = sites
      .filter((site) => site.purpose === 'COMMERCIAL')
      .map((site) => ({
        id: site.id,
        kind: 'Sites',
        name: site.name,
        region: normalizeRegion(site.owner?.region),
        city: site.city || 'Unknown',
        powerCapacityKw: site.powerCapacityKw,
        leaseType: site.leaseDetails?.leaseType || site.leaseType,
        expectedMonthlyPrice: site.leaseDetails?.expectedMonthlyPrice || site.expectedMonthlyPrice,
        expectedFootfall: site.leaseDetails?.expectedFootfall || site.expectedFootfall,
        owner: site.owner,
      }))

    const operatorListings: PeopleListing[] = operators.map((operator) => ({
      id: operator.id,
      kind: 'Operators',
      name: operator.name,
      region: normalizeRegion(operator.region),
      city: operator.region || 'Unknown',
      email: operator.email,
      phone: operator.phone,
      role: operator.role,
    }))

    const technicianListings: PeopleListing[] = technicians.map((technician) => ({
      id: technician.id,
      kind: 'Technicians',
      name: technician.name,
      region: normalizeRegion(technician.region),
      city: technician.region || 'Unknown',
      email: technician.email,
      phone: technician.phone,
      role: technician.role,
    }))

    return [...siteListings, ...operatorListings, ...technicianListings]
  }, [operators, sites, technicians])

  const regionOptions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(listings.map((listing) => listing.region))).sort()
    return ['ALL', ...uniqueRegions]
  }, [listings])

  const filteredListings = useMemo(() => {
    return listings
      .filter((listing) => (kind === 'All' ? true : listing.kind === kind))
      .filter((listing) => (region === 'ALL' ? true : listing.region === region))
      .filter((listing) => {
        if (!q.trim()) return true
        const haystack = `${listing.name} ${listing.city} ${listing.region}`.toLowerCase()
        return haystack.includes(q.toLowerCase())
      })
  }, [kind, listings, q, region])

  const isLoading = sitesLoading || operatorsLoading || techniciansLoading

  const handleApply = (siteId: string) => {
    setSelectedSiteId(siteId)
    setSelectedListing(null)
    setViewMode('APPLY')
  }

  const handleOpenDetails = (listing: MarketplaceListing) => {
    setSelectedListing({
      id: listing.id,
      kind: listing.kind,
      name: listing.name,
      city: listing.city,
      region: listing.region,
    })
  }

  const handleCloseDetails = () => {
    setSelectedListing(null)
  }

  if (viewMode === 'APPLY' && selectedSiteId) {
    return (
      <DashboardLayout pageTitle="Apply for Site">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setViewMode('LIST')}
            className="mb-4 text-sm text-muted hover:text-text flex items-center gap-1"
          >
            {'<-'} Back to Marketplace
          </button>
          <SiteApplicationForm
            siteId={selectedSiteId}
            onSuccess={() => setViewMode('LIST')}
            onCancel={() => setViewMode('LIST')}
            embedded={true}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Marketplace">
      <div className="space-y-4">
        <div className="card grid md:grid-cols-4 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or city"
            className="input md:col-span-2"
          />
          <select value={kind} onChange={(e) => setKind(e.target.value as ListingKind | 'All')} className="select">
            {['All', 'Operators', 'Sites', 'Technicians'].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="select">
            {regionOptions.map((option) => (
              <option key={option} value={option}>
                {humanizeRegion(option)}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="card">
                <TextSkeleton lines={3} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredListings.length === 0 && (
              <div className="md:col-span-2 xl:col-span-3 card text-sm text-muted text-center">
                No marketplace listings match your filters.
              </div>
            )}
            {filteredListings.map((listing) => (
              <div key={listing.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted">{listing.kind}</div>
                    <div className="text-lg font-bold text-text">{listing.name}</div>
                  </div>
                  <span className={`pill ${listing.kind === 'Sites' ? 'active' : 'neutral'}`}>{listing.kind}</span>
                </div>

                <div className="text-sm text-muted flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {listing.city} - {humanizeRegion(listing.region)}
                </div>

                {isSiteListing(listing) && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Lease Type</div>
                      <div className="font-semibold capitalize">
                        {listing.leaseType ? listing.leaseType.replace('_', ' ').toLowerCase() : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Price</div>
                      <div className="font-semibold">
                        {listing.expectedMonthlyPrice ? `$${listing.expectedMonthlyPrice}/mo` : 'Negotiable'}
                      </div>
                    </div>
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Power</div>
                      <div className="font-semibold">{listing.powerCapacityKw} kW</div>
                    </div>
                    <div className="bg-muted/20 p-2 rounded">
                      <div className="text-muted">Footfall</div>
                      <div className="font-semibold">
                        {listing.expectedFootfall ? listing.expectedFootfall.toLowerCase() : 'medium'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button className="btn secondary flex-1" onClick={() => handleOpenDetails(listing)}>
                    Details
                  </button>
                  {listing.kind === 'Sites' && canApplyToSite && (
                    <button className="btn primary flex-1" onClick={() => handleApply(listing.id)}>
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MarketplaceDetailsDrawer
        listing={selectedListing}
        open={Boolean(selectedListing)}
        canApplyToSite={canApplyToSite}
        onClose={handleCloseDetails}
        onApplySite={handleApply}
      />
    </DashboardLayout>
  )
}
