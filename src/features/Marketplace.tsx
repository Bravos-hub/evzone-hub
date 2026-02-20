import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getErrorMessage } from '@/core/api/errors'
import { ROLE_GROUPS } from '@/constants/roles'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { SiteApplicationForm } from '@/features/SiteApplicationForm'
import { MarketplaceDetailsDrawer } from '@/features/marketplace/components/MarketplaceDetailsDrawer'
import { useMarketplaceRecentContacts, useTrackMarketplaceContact } from '@/features/marketplace/hooks/useMarketplaceContacts'
import {
  useProviderRequirements,
  useRelationshipComplianceStatuses,
  useMarketplaceProviders,
  useProviderRelationships,
  useRequestProviderRelationship,
  useUploadProviderDocument,
  useUpdateRelationshipComplianceProfile,
} from '@/modules/integrations/useProviders'
import {
  normalizeProviderStatus,
  normalizeRelationshipStatus,
} from '@/modules/integrations/providerStatus'
import type {
  MarketplaceContactEntityKind,
  MarketplaceContactEventType,
  MarketplaceRecentContact,
  ProviderDocumentType,
  ProviderRelationship,
} from '@/core/api/types'

// New Imports
import { useMarketplaceFilters } from './marketplace/hooks/useMarketplaceFilters'
import { MarketplaceFilters } from './marketplace/components/MarketplaceFilters'
import { MarketplaceStats } from './marketplace/components/MarketplaceStats'
import { ListingCard } from './marketplace/components/ListingCard'
import { ListingTable } from './marketplace/components/ListingTable'
import { QuickSubmitModal, type QuickSubmitFormState } from './marketplace/components/QuickSubmitModal'
import {
  normalizeRegion,
  humanizeRegion,
  type ProviderRelationshipBadgeStatus
} from './marketplace/utils'
import type {
  ListingsMarketplaceListing,
  MarketplaceSummaryListing,
  PeopleListing,
  ProviderListing,
  SiteListing,
  UnifiedMarketplaceListing
} from './marketplace/types'

const LISTING_KIND_TO_CONTACT_KIND: Record<MarketplaceSummaryListing['kind'], MarketplaceContactEntityKind> = {
  Sites: 'SITE',
  Operators: 'OPERATOR',
  Technicians: 'TECHNICIAN',
  Providers: 'PROVIDER',
}

function complianceBlockerCount(status?: { missingCritical: string[]; expiredCritical: Array<{ id: string }> }): number {
  if (!status) return 0
  return status.missingCritical.length + status.expiredCritical.length
}

export function Marketplace() {
  const [searchParams] = useSearchParams()
  // const kindParam = searchParams.get('kind') // Handled in hook
  const { user } = useAuthStore()
  const { data: me } = useMe()

  // --- Filter Hook ---
  const { filters, actions } = useMarketplaceFilters()

  const role = me?.role || user?.role
  const ownerCapability = me?.ownerCapability || user?.ownerCapability
  const ownerOrgId = me?.orgId || me?.organizationId || user?.orgId || user?.organizationId
  const isPlatformOps = role ? ROLE_GROUPS.PLATFORM_OPS.includes(role) : false
  const isStationOperator = role === 'STATION_OPERATOR'
  const isSwapCapableOwner = role === 'STATION_OWNER' && (ownerCapability === 'SWAP' || ownerCapability === 'BOTH')
  const canViewRelationshipData = isPlatformOps || isStationOperator || isSwapCapableOwner
  const canRequestPartnership = isSwapCapableOwner

  const canApplyToSite = role === 'STATION_OWNER' || role === 'EVZONE_OPERATOR'

  // --- Data Fetching ---
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
  } = useMarketplaceProviders()

  const shouldLoadRelationships = canViewRelationshipData && !!ownerOrgId
  const {
    data: relationships = [],
    isLoading: relationshipsLoading,
    error: relationshipsError,
    refetch: refetchRelationships,
  } = useProviderRelationships(ownerOrgId ? { ownerOrgId } : undefined, { enabled: shouldLoadRelationships })

  const relationshipRows = useMemo<ProviderRelationship[]>(
    () => (Array.isArray(relationships) ? relationships : []),
    [relationships],
  )
  const relationshipIds = useMemo(() => relationshipRows.map((relationship) => relationship.id), [relationshipRows])
  const {
    data: relationshipComplianceStatuses = [],
    isLoading: relationshipComplianceLoading,
  } = useRelationshipComplianceStatuses(relationshipIds, { enabled: relationshipIds.length > 0 })

  const { data: stationOwnerRequirements = [] } = useProviderRequirements({ appliesTo: 'STATION_OWNER' })
  const requestProviderRelationshipMutation = useRequestProviderRelationship()
  const uploadProviderDocumentMutation = useUploadProviderDocument()
  const updateRelationshipComplianceProfileMutation = useUpdateRelationshipComplianceProfile()
  const { data: recentContacts = [], isLoading: loadingRecentContacts } = useMarketplaceRecentContacts(12)
  const trackMarketplaceContactMutation = useTrackMarketplaceContact()

  // --- Memoized Data Helpers ---
  const relationshipByProvider = useMemo(() => {
    const map = new Map<string, ProviderRelationship>()
    if (!shouldLoadRelationships) return map

    relationshipRows.forEach((relationship) => {
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
  }, [relationshipRows, shouldLoadRelationships])

  const relationshipComplianceById = useMemo(() => {
    const complianceRows = Array.isArray(relationshipComplianceStatuses) ? relationshipComplianceStatuses : []
    return complianceRows.reduce<Map<string, (typeof complianceRows)[number]>>((acc, status) => {
      if (status.targetId) acc.set(status.targetId, status)
      return acc
    }, new Map())
  }, [relationshipComplianceStatuses])

  // --- Derived Listings ---
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

  const providerListings = useMemo<ProviderListing[]>(() => {
    const rows = Array.isArray(providers) ? providers : []
    return rows.map((provider) => {
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
    ownerOrgId,
    providers,
    relationshipByProvider,
    relationshipComplianceById,
    relationshipsError,
  ])

  // --- Filtering Logic ---
  const listingRegionOptions = useMemo(() => {
    const uniqueRegions = Array.from(
      new Set([...listings.map((listing) => listing.region), ...providerListings.map((provider) => provider.region)]),
    ).sort()
    return ['ALL', ...uniqueRegions]
  }, [listings, providerListings])

  const providerRegionOptions = useMemo(() => {
    const uniqueRegions = Array.from(new Set(providerListings.map((provider) => provider.region))).sort()
    return ['ALL', ...uniqueRegions]
  }, [providerListings])

  const filteredListings = useMemo(() => {
    return listings
      .filter((listing) => {
        if (filters.kind === 'All') return true
        if (filters.kind === 'Providers') return false
        return listing.kind === filters.kind
      })
      .filter((listing) => (filters.region === 'ALL' ? true : listing.region === filters.region))
      .filter((listing) => {
        if (!filters.q.trim()) return true
        const haystack = `${listing.name} ${listing.city} ${listing.region}`.toLowerCase()
        return haystack.includes(filters.q.toLowerCase())
      })
  }, [filters.kind, listings, filters.q, filters.region])

  const filteredProviderListings = useMemo(() => {
    return providerListings
      .filter((provider) => (filters.kind === 'All' ? true : filters.kind === 'Providers'))
      .filter((provider) => (filters.region === 'ALL' ? true : provider.region === filters.region))
      .filter((provider) => {
        if (!filters.q.trim()) return true
        const haystack = `${provider.name} ${provider.city} ${provider.region}`.toLowerCase()
        return haystack.includes(filters.q.toLowerCase())
      })
      .filter((provider) => (filters.providerRegion === 'ALL' ? true : provider.region === filters.providerRegion))
      .filter((provider) => {
        if (!filters.providerQuery.trim()) return true
        const haystack = `${provider.name} ${provider.region} ${provider.standard}`.toLowerCase()
        return haystack.includes(filters.providerQuery.toLowerCase())
      })
      .filter((provider) => (filters.providerStatus === 'All' ? true : provider.providerStatus === filters.providerStatus))
      .filter((provider) => (filters.relationshipStatus === 'All' ? true : provider.relationshipStatus === filters.relationshipStatus))
  }, [filters, providerListings])

  const unifiedListings = useMemo<UnifiedMarketplaceListing[]>(
    () => [...filteredListings, ...filteredProviderListings],
    [filteredListings, filteredProviderListings],
  )

  // --- UI State & Actions ---
  const listingsLoading = sitesLoading || operatorsLoading || techniciansLoading
  const providersLoadingState =
    providersLoading || (shouldLoadRelationships && (relationshipsLoading || relationshipComplianceLoading))
  const providerQueryError = providersError || (shouldLoadRelationships ? relationshipsError : null)
  const showingProviderCards = filters.kind === 'All' || filters.kind === 'Providers'
  const showUnifiedLoading = listingsLoading || (showingProviderCards && providersLoadingState)

  const [viewModeState, setViewModeState] = useState<'LIST' | 'APPLY'>('LIST')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [selectedListing, setSelectedListing] = useState<MarketplaceSummaryListing | null>(null)
  const [providerAck, setProviderAck] = useState('')
  const [providerActionError, setProviderActionError] = useState('')

  // Quick Submit Modal State
  const [showQuickSubmitModal, setShowQuickSubmitModal] = useState(false)
  const [quickSubmitProviderName, setQuickSubmitProviderName] = useState('')
  const [quickSubmitForm, setQuickSubmitForm] = useState<QuickSubmitFormState>({
    relationshipId: '',
    requirementCode: '',
    type: 'SITE_COMPATIBILITY_DECLARATION' as ProviderDocumentType,
    name: '',
    file: null,
    storedEnergyKwh: '',
  })
  const [quickSubmitFileInputKey, setQuickSubmitFileInputKey] = useState(0)

  useEffect(() => {
    if (!providerAck) return
    const timer = window.setTimeout(() => setProviderAck(''), 2600)
    return () => window.clearTimeout(timer)
  }, [providerAck])

  const trackOutreachEvent = (listing: MarketplaceSummaryListing, eventType: MarketplaceContactEventType) => {
    trackMarketplaceContactMutation.mutate({
      entityKind: LISTING_KIND_TO_CONTACT_KIND[listing.kind],
      entityId: listing.id,
      eventType,
      entityName: listing.name,
      entityCity: listing.city,
      entityRegion: listing.region,
    })
  }

  const handleApply = (listing: MarketplaceSummaryListing) => {
    if (listing.kind !== 'Sites') return
    trackOutreachEvent(listing, 'APPLY_SITE')
    setSelectedSiteId(listing.id)
    setSelectedListing(null)
    setViewModeState('APPLY')
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
      trackOutreachEvent(provider, 'REQUEST_PARTNERSHIP')
      setProviderAck(`Partnership request sent to ${provider.name}.`)
    } catch (err) {
      setProviderActionError(getErrorMessage(err))
    }
  }

  const openQuickSubmit = (provider: ProviderListing) => {
    if (!provider.relationshipId) return
    const defaultRequirement = Array.isArray(stationOwnerRequirements) ? stationOwnerRequirements[0] : undefined
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

  if (viewModeState === 'APPLY' && selectedSiteId) {
    return (
      <DashboardLayout pageTitle="Apply for Site">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setViewModeState('LIST')}
            className="mb-4 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 flex items-center gap-1"
          >
            {'<-'} Back to Marketplace
          </button>
          <SiteApplicationForm
            siteId={selectedSiteId}
            onSuccess={() => setViewModeState('LIST')}
            onCancel={() => setViewModeState('LIST')}
            embedded={true}
          />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Marketplace">
      <div className="space-y-6">

        {/* Notifications */}
        {providerAck && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm shadow-sm">{providerAck}</div>
        )}
        {providerActionError && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm shadow-sm">
            {providerActionError}
          </div>
        )}
        {providerQueryError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 shadow-sm">
            <div>Could not load provider marketplace data: {getErrorMessage(providerQueryError)}</div>
            <button
              type="button"
              className="mt-2 px-3 py-1.5 rounded border border-red-500/40 text-red-700 hover:bg-red-500/10 text-xs font-medium"
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
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 shadow-sm">
            Provider partnership requests are disabled because your account has no organization ID.
          </div>
        )}

        {/* My Listings Stats */}
        <MarketplaceStats
          recentContacts={Array.isArray(recentContacts) ? recentContacts : []} // Ensure array
          isLoading={loadingRecentContacts}
          onOpenDetails={handleOpenDetails}
        />

        {/* Filters */}
        <div className="card p-4">
          <MarketplaceFilters
            filters={filters}
            actions={actions}
            listingRegionOptions={listingRegionOptions}
            providerRegionOptions={providerRegionOptions}
          />
        </div>

        {/* Listings Content */}
        {showUnifiedLoading ? (
          <div className={`grid gap-3 ${filters.viewMode === 'GRID' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="card h-32 animate-pulse">
                <div className="h-4 bg-panel-2 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-panel-2 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : unifiedListings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-light p-12 text-center text-muted">
            No marketplace listings match your filters. Try adjusting your search or filters.
          </div>
        ) : filters.viewMode === 'GRID' ? (
          <div className="space-y-8">
            {Object.entries(
              unifiedListings.reduce((acc, listing) => {
                const kind = listing.kind
                if (!acc[kind]) acc[kind] = []
                acc[kind].push(listing)
                return acc
              }, {} as Record<string, UnifiedMarketplaceListing[]>)
            ).map(([kind, groupListings]) => {
              // Custom labels or sorting order could be applied here
              const label = kind === 'Providers' ? 'Swap Providers' : kind

              if (groupListings.length === 0) return null

              return (
                <section key={kind} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border-light pb-2">
                    <h2 className="text-lg font-semibold text-text tracking-tight">{label}</h2>
                    <span className="text-xs font-medium text-muted bg-panel-2 px-2 py-1 rounded-full border border-border-light">
                      {groupListings.length}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupListings.map((listing) => (
                      <ListingCard
                        key={`${listing.kind}:${listing.id}`}
                        listing={listing}
                        onDetails={handleOpenDetails}
                        onApply={handleApply}
                        onRequestPartnership={(l) => requestPartnership(l)}
                        onSubmitDocs={(l) => openQuickSubmit(l)}
                        canRequestPartnership={canRequestPartnership}
                        ownerOrgId={ownerOrgId}
                        isRequestingPartnership={requestProviderRelationshipMutation.isPending}
                        canApplyToSite={canApplyToSite}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <ListingTable
            listings={unifiedListings}
            onDetails={handleOpenDetails}
            onApply={handleApply}
            onRequestPartnership={(l) => requestPartnership(l)}
            onSubmitDocs={(l) => openQuickSubmit(l)}
            canRequestPartnership={canRequestPartnership}
            ownerOrgId={ownerOrgId}
            isRequestingPartnership={requestProviderRelationshipMutation.isPending}
            canApplyToSite={canApplyToSite}
          />
        )}
      </div>

      <QuickSubmitModal
        isOpen={showQuickSubmitModal}
        onClose={() => setShowQuickSubmitModal(false)}
        providerName={quickSubmitProviderName}
        form={quickSubmitForm}
        setForm={setQuickSubmitForm}
        requirements={Array.isArray(stationOwnerRequirements) ? stationOwnerRequirements : []}
        onSubmit={() => void submitQuickRelationshipPack()}
        isSubmitting={uploadProviderDocumentMutation.isPending || updateRelationshipComplianceProfileMutation.isPending}
      />

      <MarketplaceDetailsDrawer
        listing={selectedListing}
        open={Boolean(selectedListing)}
        canApplyToSite={canApplyToSite}
        onClose={handleCloseDetails}
        onApplySite={(siteId, listing) => handleApply(listing || { id: siteId, kind: 'Sites', name: '', city: '', region: '' } as any)}
        onEmailContact={(listing) => trackOutreachEvent(listing, 'EMAIL')}
        onCallContact={(listing) => trackOutreachEvent(listing, 'CALL')}
      />
    </DashboardLayout>
  )
}
