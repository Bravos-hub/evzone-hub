import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getErrorMessage } from '@/core/api/errors'
import { ROLE_GROUPS } from '@/constants/roles'
import { useSearchParams } from 'react-router-dom'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { SiteApplicationForm } from '@/features/SiteApplicationForm'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import { MarketplaceDetailsDrawer } from '@/features/marketplace/components/MarketplaceDetailsDrawer'
import {
  useProviderRequirements,
  useRelationshipComplianceStatuses,
  useProviderRelationships,
  useProviders,
  useRequestProviderRelationship,
  useUploadProviderDocument,
  useUpdateRelationshipComplianceProfile,
} from '@/modules/integrations/useProviders'
import {
  humanizeProviderStatus,
  normalizeProviderStatus,
  normalizeRelationshipStatus,
  type NormalizedProviderStatus,
  type NormalizedRelationshipStatus,
} from '@/modules/integrations/providerStatus'
import type { ProviderDocumentType, ProviderRelationship, Site, SwapProvider, User } from '@/core/api/types'
import type { MarketplaceSummaryListing } from '@/features/marketplace/types'

type ListingKind = 'Operators' | 'Sites' | 'Technicians'
type MarketplaceTab = 'LISTINGS' | 'PROVIDERS'
type ViewMode = 'LIST' | 'APPLY'

function parseListingKindParam(value: string | null): ListingKind | 'All' {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'all') return 'All'
  if (normalized === 'operators') return 'Operators'
  if (normalized === 'technicians') return 'Technicians'
  return 'Sites'
}

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

type ListingsMarketplaceListing = SiteListing | PeopleListing

type ProviderRelationshipBadgeStatus = NormalizedRelationshipStatus | 'N/A'

type ProviderListing = BaseListing & {
  kind: 'Providers'
  providerStatus: NormalizedProviderStatus
  relationshipStatus: ProviderRelationshipBadgeStatus
  relationshipId?: string
  relationshipComplianceState?: 'READY' | 'WARN' | 'BLOCKED'
  relationshipBlockers: number
  standard: string
  stationCount: number
  batteriesSupported: string[]
  canRequest: boolean
}

const normalizeRegion = (value?: string | null) =>
  value && value.trim() ? value.trim().toUpperCase().replace(/\s+/g, '_') : 'UNKNOWN'

const humanizeRegion = (value: string) =>
  value === 'ALL' ? 'All regions' : value.replace(/_/g, ' ')

const humanizeStatus = (value: string) => (value === 'N/A' ? 'N/A' : humanizeProviderStatus(value))

const PROVIDER_STATUS_OPTIONS: Array<'All' | NormalizedProviderStatus> = [
  'All',
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
  'UNKNOWN',
]

const RELATIONSHIP_STATUS_OPTIONS: Array<'All' | NormalizedRelationshipStatus> = [
  'All',
  'NONE',
  'REQUESTED',
  'PROVIDER_ACCEPTED',
  'DOCS_PENDING',
  'ADMIN_APPROVED',
  'ACTIVE',
  'SUSPENDED',
  'TERMINATED',
  'UNKNOWN',
]

function providerStatusBadgeClass(status: NormalizedProviderStatus): string {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700'
  if (status === 'PENDING_REVIEW') return 'bg-amber-100 text-amber-700'
  if (status === 'REJECTED') return 'bg-rose-100 text-rose-700'
  if (status === 'SUSPENDED') return 'bg-red-100 text-red-700'
  if (status === 'UNKNOWN') return 'bg-slate-200 text-slate-700'
  return 'bg-slate-100 text-slate-700'
}

function relationshipStatusBadgeClass(status: ProviderRelationshipBadgeStatus): string {
  if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700'
  if (status === 'REQUESTED' || status === 'PROVIDER_ACCEPTED' || status === 'DOCS_PENDING' || status === 'ADMIN_APPROVED') {
    return 'bg-amber-100 text-amber-700'
  }
  if (status === 'SUSPENDED' || status === 'TERMINATED') return 'bg-red-100 text-red-700'
  if (status === 'UNKNOWN') return 'bg-slate-200 text-slate-700'
  return 'bg-slate-100 text-slate-700'
}

function relationshipComplianceBadgeClass(status?: 'READY' | 'WARN' | 'BLOCKED'): string {
  if (status === 'READY') return 'bg-emerald-100 text-emerald-700'
  if (status === 'WARN') return 'bg-amber-100 text-amber-700'
  if (status === 'BLOCKED') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

function complianceBlockerCount(status?: { missingCritical: string[]; expiredCritical: Array<{ id: string }> }): number {
  if (!status) return 0
  return status.missingCritical.length + status.expiredCritical.length
}

const isSiteListing = (listing: ListingsMarketplaceListing): listing is SiteListing => listing.kind === 'Sites'

export function Marketplace() {
  const [searchParams] = useSearchParams()
  const kindParam = searchParams.get('kind')
  const { user } = useAuthStore()
  const { data: me } = useMe()

  const role = me?.role || user?.role
  const ownerCapability = me?.ownerCapability || user?.ownerCapability
  const ownerOrgId = me?.orgId || me?.organizationId || user?.orgId || user?.organizationId
  const isPlatformOps = role ? ROLE_GROUPS.PLATFORM_OPS.includes(role) : false
  const isStationOperator = role === 'STATION_OPERATOR'
  const isSwapCapableOwner = role === 'STATION_OWNER' && (ownerCapability === 'SWAP' || ownerCapability === 'BOTH')
  const canSeeProvidersTab = isPlatformOps || isStationOperator || isSwapCapableOwner
  const canRequestPartnership = isSwapCapableOwner

  const canApplyToSite = role === 'STATION_OWNER' || role === 'EVZONE_OPERATOR'

  const { data: sites = [], isLoading: sitesLoading } = useSites({ purpose: 'COMMERCIAL' })
  const { data: operators = [], isLoading: operatorsLoading } = useUsers({
    role: 'STATION_OPERATOR',
    status: 'Active',
  })
  const { data: technicians = [], isLoading: techniciansLoading } = useUsers({
    role: 'TECHNICIAN_PUBLIC',
    status: 'Active',
  })

  const {
    data: providers = [],
    isLoading: providersLoading,
    error: providersError,
    refetch: refetchProviders,
  } = useProviders(undefined, { enabled: canSeeProvidersTab })
  const shouldLoadRelationships = canSeeProvidersTab && !!ownerOrgId
  const {
    data: relationships = [],
    isLoading: relationshipsLoading,
    error: relationshipsError,
    refetch: refetchRelationships,
  } = useProviderRelationships(ownerOrgId ? { ownerOrgId } : undefined, { enabled: shouldLoadRelationships })
  const relationshipIds = useMemo(() => relationships.map((relationship) => relationship.id), [relationships])
  const {
    data: relationshipComplianceStatuses = [],
    isLoading: relationshipComplianceLoading,
  } = useRelationshipComplianceStatuses(relationshipIds, { enabled: relationshipIds.length > 0 })
  const { data: stationOwnerRequirements = [] } = useProviderRequirements({ appliesTo: 'STATION_OWNER' })
  const requestProviderRelationshipMutation = useRequestProviderRelationship()
  const uploadProviderDocumentMutation = useUploadProviderDocument()
  const updateRelationshipComplianceProfileMutation = useUpdateRelationshipComplianceProfile()

  const [tab, setTab] = useState<MarketplaceTab>('LISTINGS')
  const [kind, setKind] = useState<ListingKind | 'All'>(() => parseListingKindParam(kindParam))
  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [q, setQ] = useState('')

  const [providerQuery, setProviderQuery] = useState('')
  const [providerStatusFilter, setProviderStatusFilter] = useState<'All' | NormalizedProviderStatus>('All')
  const [relationshipStatusFilter, setRelationshipStatusFilter] = useState<'All' | NormalizedRelationshipStatus>('All')

  const [viewMode, setViewMode] = useState<ViewMode>('LIST')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<MarketplaceSummaryListing | null>(null)
  const [providerAck, setProviderAck] = useState('')
  const [providerActionError, setProviderActionError] = useState('')
  const [showQuickSubmitModal, setShowQuickSubmitModal] = useState(false)
  const [quickSubmitProviderName, setQuickSubmitProviderName] = useState('')
  const [quickSubmitForm, setQuickSubmitForm] = useState({
    relationshipId: '',
    requirementCode: '',
    type: 'SITE_COMPATIBILITY_DECLARATION' as ProviderDocumentType,
    name: '',
    file: null as File | null,
    storedEnergyKwh: '',
  })
  const [quickSubmitFileInputKey, setQuickSubmitFileInputKey] = useState(0)

  useEffect(() => {
    if (!canSeeProvidersTab && tab === 'PROVIDERS') {
      setTab('LISTINGS')
    }
  }, [canSeeProvidersTab, tab])

  useEffect(() => {
    setKind(parseListingKindParam(kindParam))
  }, [kindParam])

  useEffect(() => {
    if (!providerAck) return
    const timer = window.setTimeout(() => setProviderAck(''), 2600)
    return () => window.clearTimeout(timer)
  }, [providerAck])

  const listings = useMemo<ListingsMarketplaceListing[]>(() => {
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

  const relationshipByProvider = useMemo(() => {
    const map = new Map<string, ProviderRelationship>()
    if (!shouldLoadRelationships) return map

    ;(relationships ?? []).forEach((relationship) => {
      const existing = map.get(relationship.providerId)
      if (!existing) {
        map.set(relationship.providerId, relationship)
        return
      }
      const existingTime = new Date(existing.updatedAt ?? existing.createdAt).getTime()
      const nextTime = new Date(relationship.updatedAt ?? relationship.createdAt).getTime()
      if (nextTime >= existingTime) {
        map.set(relationship.providerId, relationship)
      }
    })
    return map
  }, [relationships, shouldLoadRelationships])

  const relationshipComplianceById = useMemo(() => {
    return relationshipComplianceStatuses.reduce<Map<string, (typeof relationshipComplianceStatuses)[number]>>((acc, status) => {
      if (status.targetId) acc.set(status.targetId, status)
      return acc
    }, new Map())
  }, [relationshipComplianceStatuses])

  const providerListings = useMemo<ProviderListing[]>(() => {
    if (!canSeeProvidersTab) return []

    return (providers as SwapProvider[]).map((provider) => {
      const providerStatus = normalizeProviderStatus(provider.status)
      const relationship = relationshipByProvider.get(provider.id)
      let relationshipStatus: ProviderRelationshipBadgeStatus = 'N/A'

      if (ownerOrgId) {
        relationshipStatus = relationshipsError
          ? 'UNKNOWN'
          : normalizeRelationshipStatus(relationship?.status)
      }
      const relationshipCompliance = relationship ? relationshipComplianceById.get(relationship.id) : undefined
      const relationshipBlockers = complianceBlockerCount(relationshipCompliance)

      const canRequest =
        canRequestPartnership &&
        !!ownerOrgId &&
        !relationshipsError &&
        providerStatus === 'APPROVED' &&
        (relationshipStatus === 'NONE' || relationshipStatus === 'TERMINATED')

      return {
        id: provider.id,
        kind: 'Providers',
        name: provider.name,
        city: provider.region || 'Unknown',
        region: normalizeRegion(provider.region),
        providerStatus,
        relationshipStatus,
        relationshipId: relationship?.id,
        relationshipComplianceState: relationshipCompliance?.overallState,
        relationshipBlockers,
        standard: provider.standard,
        stationCount: provider.stationCount,
        batteriesSupported: provider.batteriesSupported || [],
        canRequest,
      }
    })
  }, [
    canRequestPartnership,
    canSeeProvidersTab,
    ownerOrgId,
    providers,
    relationshipByProvider,
    relationshipComplianceById,
    relationshipsError,
  ])

  const listingRegionOptions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(listings.map((listing) => listing.region))).sort()
    return ['ALL', ...uniqueRegions]
  }, [listings])

  const providerRegionOptions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(providerListings.map((provider) => provider.region))).sort()
    return ['ALL', ...uniqueRegions]
  }, [providerListings])

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

  const [providerRegionFilter, setProviderRegionFilter] = useState<'ALL' | string>('ALL')

  const filteredProviderListings = useMemo(() => {
    return providerListings
      .filter((provider) => (providerRegionFilter === 'ALL' ? true : provider.region === providerRegionFilter))
      .filter((provider) => {
        if (!providerQuery.trim()) return true
        const haystack = `${provider.name} ${provider.region} ${provider.standard}`.toLowerCase()
        return haystack.includes(providerQuery.toLowerCase())
      })
      .filter((provider) => (providerStatusFilter === 'All' ? true : provider.providerStatus === providerStatusFilter))
      .filter((provider) => (relationshipStatusFilter === 'All' ? true : provider.relationshipStatus === relationshipStatusFilter))
  }, [providerListings, providerQuery, providerRegionFilter, providerStatusFilter, relationshipStatusFilter])

  const listingsLoading = sitesLoading || operatorsLoading || techniciansLoading
  const providersLoadingState =
    providersLoading || (shouldLoadRelationships && (relationshipsLoading || relationshipComplianceLoading))
  const providerQueryError = providersError || (shouldLoadRelationships ? relationshipsError : null)

  const handleApply = (siteId: string) => {
    setSelectedSiteId(siteId)
    setSelectedListing(null)
    setViewMode('APPLY')
  }

  const handleOpenDetails = (listing: MarketplaceSummaryListing) => {
    setSelectedListing(listing)
  }

  const handleCloseDetails = () => {
    setSelectedListing(null)
  }

  const requestPartnership = async (provider: ProviderListing) => {
    setProviderActionError('')
    setProviderAck('')

    if (!ownerOrgId) {
      setProviderActionError('Your account has no organization ID. Contact admin to complete organization setup.')
      return
    }

    try {
      await requestProviderRelationshipMutation.mutateAsync({
        providerId: provider.id,
        ownerOrgId,
      })
      setProviderAck(`Partnership request sent to ${provider.name}.`)
    } catch (err) {
      setProviderActionError(getErrorMessage(err))
    }
  }

  const openQuickSubmit = (provider: ProviderListing) => {
    if (!provider.relationshipId) return
    const defaultRequirement = stationOwnerRequirements[0]
    setQuickSubmitProviderName(provider.name)
    setQuickSubmitFileInputKey((prev) => prev + 1)
    setQuickSubmitForm({
      relationshipId: provider.relationshipId,
      requirementCode: defaultRequirement?.requirementCode || '',
      type: (defaultRequirement?.acceptedDocTypes?.[0] as ProviderDocumentType | undefined) || 'SITE_COMPATIBILITY_DECLARATION',
      name: defaultRequirement?.title || '',
      file: null,
      storedEnergyKwh: '',
    })
    setProviderActionError('')
    setShowQuickSubmitModal(true)
  }

  const submitQuickRelationshipPack = async () => {
    if (!quickSubmitForm.relationshipId || !quickSubmitForm.file || !quickSubmitForm.name.trim()) {
      setProviderActionError('Relationship, file, and document name are required for quick submit.')
      return
    }

    const storedEnergy = quickSubmitForm.storedEnergyKwh.trim()
    try {
      if (storedEnergy) {
        await updateRelationshipComplianceProfileMutation.mutateAsync({
          id: quickSubmitForm.relationshipId,
          data: {
            complianceProfile: {
              storedEnergyKwh: Number(storedEnergy),
            },
          },
        })
      }

      await uploadProviderDocumentMutation.mutateAsync({
        relationshipId: quickSubmitForm.relationshipId,
        type: quickSubmitForm.type,
        requirementCode: quickSubmitForm.requirementCode || undefined,
        name: quickSubmitForm.name.trim(),
        file: quickSubmitForm.file,
        metadata: {
          source: 'marketplace-quick-submit',
        },
      })

      setShowQuickSubmitModal(false)
      setProviderAck(`Submitted relationship compliance pack for ${quickSubmitProviderName}.`)
    } catch (error) {
      setProviderActionError(getErrorMessage(error))
    }
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
        <div className="card flex items-center gap-2">
          <button
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              tab === 'LISTINGS' ? 'bg-accent text-white' : 'bg-muted/40 text-muted hover:text-text'
            }`}
            onClick={() => setTab('LISTINGS')}
          >
            Listings
          </button>
          {canSeeProvidersTab && (
            <button
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                tab === 'PROVIDERS' ? 'bg-accent text-white' : 'bg-muted/40 text-muted hover:text-text'
              }`}
              onClick={() => setTab('PROVIDERS')}
            >
              Providers
            </button>
          )}
        </div>

        {tab === 'LISTINGS' && (
          <>
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
                {listingRegionOptions.map((option) => (
                  <option key={option} value={option}>
                    {humanizeRegion(option)}
                  </option>
                ))}
              </select>
            </div>

            {listingsLoading ? (
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
                      <button
                        className="btn secondary flex-1"
                        onClick={() =>
                          handleOpenDetails({
                            id: listing.id,
                            kind: listing.kind,
                            name: listing.name,
                            city: listing.city,
                            region: listing.region,
                          })
                        }
                      >
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
          </>
        )}

        {tab === 'PROVIDERS' && canSeeProvidersTab && (
          <>
            {providerAck && (
              <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{providerAck}</div>
            )}
            {providerActionError && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
                {providerActionError}
              </div>
            )}
            {providerQueryError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                <div>Could not load provider marketplace data: {getErrorMessage(providerQueryError)}</div>
                <button
                  type="button"
                  className="mt-2 px-3 py-1.5 rounded border border-red-500/40 text-red-700 hover:bg-red-500/10"
                  onClick={() => {
                    void refetchProviders()
                    if (shouldLoadRelationships) {
                      void refetchRelationships()
                    }
                  }}
                >
                  Retry loading providers
                </button>
              </div>
            )}
            {canRequestPartnership && !ownerOrgId && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700">
                Provider partnership requests are disabled because your account has no organization ID.
              </div>
            )}

            <div className="card grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                value={providerQuery}
                onChange={(e) => setProviderQuery(e.target.value)}
                placeholder="Search provider, region, or standard"
                className="input md:col-span-2"
              />
              <select
                value={providerRegionFilter}
                onChange={(e) => setProviderRegionFilter(e.target.value)}
                className="select"
              >
                {providerRegionOptions.map((option) => (
                  <option key={option} value={option}>
                    {humanizeRegion(option)}
                  </option>
                ))}
              </select>
              <select
                value={providerStatusFilter}
                onChange={(e) => setProviderStatusFilter(e.target.value as 'All' | NormalizedProviderStatus)}
                className="select"
              >
                {PROVIDER_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All provider statuses' : humanizeStatus(option)}
                  </option>
                ))}
              </select>
              <select
                value={relationshipStatusFilter}
                onChange={(e) => setRelationshipStatusFilter(e.target.value as 'All' | NormalizedRelationshipStatus)}
                className="select"
              >
                {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All relationship statuses' : humanizeStatus(option)}
                  </option>
                ))}
              </select>
            </div>

            {providersLoadingState ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="card">
                    <TextSkeleton lines={3} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProviderListings.length === 0 && (
                  <div className="md:col-span-2 xl:col-span-3 card text-sm text-muted text-center">
                    No providers match your filters.
                  </div>
                )}
                {filteredProviderListings.map((provider) => (
                  <div key={provider.id} className="card space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted">Provider</div>
                        <div className="text-lg font-bold text-text truncate">{provider.name}</div>
                      </div>
                      <span className="pill neutral">Providers</span>
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
                      {provider.city} - {humanizeRegion(provider.region)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${providerStatusBadgeClass(provider.providerStatus)}`}>
                        Provider: {humanizeStatus(provider.providerStatus)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${relationshipStatusBadgeClass(provider.relationshipStatus)}`}>
                        Relationship: {humanizeStatus(provider.relationshipStatus)}
                      </span>
                      {provider.relationshipId && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${relationshipComplianceBadgeClass(provider.relationshipComplianceState)}`}>
                          Compliance: {provider.relationshipComplianceState || 'PENDING'}
                          {provider.relationshipBlockers > 0 ? ` (${provider.relationshipBlockers})` : ''}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/20 p-2 rounded">
                        <div className="text-muted">Standard</div>
                        <div className="font-semibold">{provider.standard}</div>
                      </div>
                      <div className="bg-muted/20 p-2 rounded">
                        <div className="text-muted">Stations</div>
                        <div className="font-semibold">{provider.stationCount.toLocaleString()}</div>
                      </div>
                      <div className="bg-muted/20 p-2 rounded col-span-2">
                        <div className="text-muted">Batteries</div>
                        <div className="font-semibold">
                          {provider.batteriesSupported.length > 0
                            ? provider.batteriesSupported.slice(0, 4).join(', ')
                            : 'Not specified'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="btn secondary flex-1"
                        onClick={() =>
                          handleOpenDetails({
                            id: provider.id,
                            kind: provider.kind,
                            name: provider.name,
                            city: provider.city,
                            region: provider.region,
                          })
                        }
                      >
                        Details
                      </button>
                      {canRequestPartnership && ownerOrgId && provider.canRequest && (
                        <button
                          className="btn primary flex-1"
                          disabled={requestProviderRelationshipMutation.isPending}
                          onClick={() => requestPartnership(provider)}
                        >
                          {requestProviderRelationshipMutation.isPending ? 'Requesting...' : 'Request Partnership'}
                        </button>
                      )}
                      {canRequestPartnership && ownerOrgId && provider.relationshipId && provider.relationshipStatus !== 'TERMINATED' && (
                        <button
                          className="btn secondary flex-1"
                          onClick={() => openQuickSubmit(provider)}
                        >
                          Submit Docs
                        </button>
                      )}
                      {canRequestPartnership && !ownerOrgId && (
                        <button className="btn secondary flex-1 opacity-60 cursor-not-allowed" disabled>
                          Request Partnership
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showQuickSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Quick Submit Relationship Pack</h3>
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-800"
                onClick={() => setShowQuickSubmitModal(false)}
              >
                Close
              </button>
            </div>
            <div className="text-sm text-slate-600">Provider: {quickSubmitProviderName || 'Unknown'}</div>

            <select
              className="select w-full"
              value={quickSubmitForm.requirementCode}
              onChange={(e) => {
                const requirementCode = e.target.value
                const requirement = stationOwnerRequirements.find((item) => item.requirementCode === requirementCode)
                setQuickSubmitForm((prev) => ({
                  ...prev,
                  requirementCode,
                  type: (requirement?.acceptedDocTypes?.[0] as ProviderDocumentType | undefined) || prev.type,
                  name: requirement?.title || prev.name,
                }))
              }}
            >
              <option value="">Select station-owner requirement</option>
              {stationOwnerRequirements.map((requirement) => (
                <option key={requirement.requirementCode} value={requirement.requirementCode}>
                  {requirement.title}
                </option>
              ))}
            </select>

            <select
              className="select w-full"
              value={quickSubmitForm.type}
              onChange={(e) =>
                setQuickSubmitForm((prev) => ({
                  ...prev,
                  type: e.target.value as ProviderDocumentType,
                }))
              }
            >
              <option value="SITE_COMPATIBILITY_DECLARATION">SITE_COMPATIBILITY_DECLARATION</option>
              <option value="TECHNICAL_CONFORMANCE">TECHNICAL_CONFORMANCE</option>
              <option value="SOP_ACKNOWLEDGEMENT">SOP_ACKNOWLEDGEMENT</option>
              <option value="INSURANCE">INSURANCE</option>
              <option value="COMMERCIAL_AGREEMENT">COMMERCIAL_AGREEMENT</option>
            </select>

            <input
              className="input w-full"
              value={quickSubmitForm.name}
              onChange={(e) => setQuickSubmitForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Document name"
            />
            <input
              key={quickSubmitFileInputKey}
              className="input w-full"
              type="file"
              onChange={(e) => setQuickSubmitForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
            />
            <input
              className="input w-full"
              value={quickSubmitForm.storedEnergyKwh}
              onChange={(e) => setQuickSubmitForm((prev) => ({ ...prev, storedEnergyKwh: e.target.value }))}
              placeholder="Stored energy kWh (optional, for HK DG profile checks)"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowQuickSubmitModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={uploadProviderDocumentMutation.isPending || updateRelationshipComplianceProfileMutation.isPending}
                onClick={() => {
                  void submitQuickRelationshipPack()
                }}
              >
                {uploadProviderDocumentMutation.isPending || updateRelationshipComplianceProfileMutation.isPending
                  ? 'Submitting...'
                  : 'Submit Pack'}
              </button>
            </div>
          </div>
        </div>
      )}

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
