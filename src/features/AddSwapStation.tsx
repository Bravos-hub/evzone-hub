import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PATHS } from '@/app/router/paths'
import { getErrorMessage } from '@/core/api/errors'
import { useCreateStation, useUpsertSwapBays, useUpsertStationBatteries } from '@/modules/stations/hooks/useStations'
import { useProviderRelationships, useProviders, useRequestProviderRelationship } from '@/modules/integrations/useProviders'
import { auditLogger } from '@/core/utils/auditLogger'
import { useAuthStore } from '@/core/auth/authStore'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useApplications } from '@/modules/applications/hooks/useApplications'
import { InlineSkeleton } from '@/ui/components/SkeletonCards'
import type { ProviderRelationship, SwapProvider } from '@/core/api/types'
import { buildAccessibleSites } from '@/modules/sites/utils/accessibleSites'
import {
  canCreateChargeStation,
  canCreateSwapStation,
  resolveViewerContext,
} from '@/modules/stations/utils/stationCreationPolicy'

type VehicleType = 'BIKE' | 'CAR' | 'MIXED'
type HardwareMode = 'COMPUTERIZED' | 'MANUAL'
type Protocol = 'MQTT' | 'HTTP'

type SwapBay = {
  id: string
  batteryId: string
}

type SwapStationForm = {
  siteId: string
  name: string
  vehicleType: VehicleType
  providerId: string
  hardwareMode: HardwareMode
  protocols: Protocol[]
  gatewayId: string
  mqttBroker: string
  httpEndpoint: string
  authToken: string
  bayCount: number
  bays: SwapBay[]
}

const STEPS = [
  { key: 'basics', label: 'Basics' },
  { key: 'connect', label: 'Connectivity' },
  { key: 'bays', label: 'Bays' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'review', label: 'Review' },
]

const formatBayId = (index: number) => `BAY-${String(index + 1).padStart(3, '0')}`

const buildBays = (count: number, existing: SwapBay[]) => {
  const safeCount = Math.max(0, count)
  return Array.from({ length: safeCount }, (_, idx) => ({
    id: formatBayId(idx),
    batteryId: existing[idx]?.batteryId || '',
  }))
}

type NormalizedProviderStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
type NormalizedRelationshipStatus = 'REQUESTED' | 'PROVIDER_ACCEPTED' | 'DOCS_PENDING' | 'ADMIN_APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'NONE'

function normalizeProviderStatus(status?: string): NormalizedProviderStatus {
  const normalized = (status ?? '').toUpperCase()
  if (normalized === 'ACTIVE') return 'APPROVED'
  if (normalized === 'PENDING') return 'PENDING_REVIEW'
  if (normalized === 'INACTIVE') return 'SUSPENDED'
  if (normalized === 'REJECTED') return 'REJECTED'
  if (normalized === 'SUSPENDED') return 'SUSPENDED'
  if (normalized === 'APPROVED') return 'APPROVED'
  if (normalized === 'PENDING_REVIEW') return 'PENDING_REVIEW'
  return 'DRAFT'
}

function normalizeRelationshipStatus(status?: string): NormalizedRelationshipStatus {
  const normalized = (status ?? '').toUpperCase()
  if (!normalized) return 'NONE'
  if (normalized === 'REQUESTED') return 'REQUESTED'
  if (normalized === 'PROVIDER_ACCEPTED') return 'PROVIDER_ACCEPTED'
  if (normalized === 'DOCS_PENDING') return 'DOCS_PENDING'
  if (normalized === 'ADMIN_APPROVED') return 'ADMIN_APPROVED'
  if (normalized === 'ACTIVE') return 'ACTIVE'
  if (normalized === 'SUSPENDED') return 'SUSPENDED'
  if (normalized === 'TERMINATED') return 'TERMINATED'
  return 'NONE'
}

function providerUnavailableReason(provider: SwapProvider, relationship?: ProviderRelationship): string {
  const providerStatus = normalizeProviderStatus(provider.status)
  if (providerStatus !== 'APPROVED') return 'Provider is not approved by platform admin.'

  const relationshipStatus = normalizeRelationshipStatus(relationship?.status)
  switch (relationshipStatus) {
    case 'ACTIVE':
      return ''
    case 'REQUESTED':
      return 'Contract request pending provider response.'
    case 'PROVIDER_ACCEPTED':
      return 'Provider accepted; waiting for documents.'
    case 'DOCS_PENDING':
      return 'Required two-sided documents are still pending.'
    case 'ADMIN_APPROVED':
      return 'Awaiting relationship activation.'
    case 'SUSPENDED':
      return 'Relationship is suspended by admin.'
    case 'TERMINATED':
      return 'Relationship was terminated.'
    default:
      return 'No active provider contract for your organization.'
  }
}

export function AddSwapStation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { data: me, isLoading: meLoading } = useMe()
  const stationCreationContext = useMemo(() => resolveViewerContext(user, me), [user, me])
  const canCreateCharge = canCreateChargeStation(stationCreationContext)
  const canCreateSwap = canCreateSwapStation(stationCreationContext)
  const viewerOrgId = me?.orgId || me?.organizationId || user?.orgId || user?.organizationId
  const ownerOrgId = viewerOrgId
  const viewerId = me?.id || user?.id
  const scopeToOwner = user?.role === 'STATION_OWNER'

  const [step, setStep] = useState(0)
  const [ack, setAck] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectState, setConnectState] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [scanValue, setScanValue] = useState('')
  const [siteSearch, setSiteSearch] = useState('')

  useEffect(() => {
    const notice = (location.state as { notice?: string } | null)?.notice
    if (!notice) return
    setAck(notice)
    const timer = window.setTimeout(() => setAck(''), 2200)
    return () => window.clearTimeout(timer)
  }, [location.state])

  useEffect(() => {
    if (meLoading) return
    if (canCreateSwap) return

    if (stationCreationContext.requiresOwnerCapabilityChoice) {
      navigate(PATHS.OWNER.ADD_STATION_ENTRY, {
        replace: true,
        state: { notice: 'Choose station type before continuing.' },
      })
      return
    }

    if (canCreateCharge) {
      navigate(PATHS.OWNER.ADD_CHARGE_STATION, {
        replace: true,
        state: { notice: 'Your account can only add charge stations. Redirected.' },
      })
    }
  }, [canCreateCharge, canCreateSwap, meLoading, navigate, stationCreationContext.requiresOwnerCapabilityChoice])

  const [form, setForm] = useState<SwapStationForm>({
    siteId: '',
    name: '',
    vehicleType: 'MIXED',
    providerId: '',
    hardwareMode: 'COMPUTERIZED',
    protocols: [],
    gatewayId: '',
    mqttBroker: '',
    httpEndpoint: '',
    authToken: '',
    bayCount: 0,
    bays: [],
  })

  const { data: sitesData, isLoading: loadingSites } = useSites()
  const { data: applicationsData, isLoading: loadingApplications } = useApplications()
  const { data: providers, isLoading: loadingProviders } = useProviders()
  const { data: relationships } = useProviderRelationships(ownerOrgId ? { ownerOrgId } : { my: true })
  const requestRelationshipMutation = useRequestProviderRelationship()
  const createStationMutation = useCreateStation()
  const upsertSwapBaysMutation = useUpsertSwapBays()
  const upsertStationBatteriesMutation = useUpsertStationBatteries()

  const accessibleSites = useMemo(
    () =>
      buildAccessibleSites({
        sites: sitesData || [],
        applications: applicationsData || [],
        viewerId,
        viewerOrgId,
        scopeToOwner,
      }),
    [applicationsData, scopeToOwner, sitesData, viewerId, viewerOrgId]
  )
  const loadingSiteOptions = loadingSites || loadingApplications
  const normalizedSiteSearch = siteSearch.trim().toLowerCase()
  const filteredAccessibleSites = useMemo(() => {
    if (!normalizedSiteSearch) return accessibleSites
    return accessibleSites.filter((site) =>
      `${site.name} ${site.address}`.toLowerCase().includes(normalizedSiteSearch)
    )
  }, [accessibleSites, normalizedSiteSearch])
  const ownedSiteOptions = useMemo(
    () => filteredAccessibleSites.filter((site) => site.source === 'OWNED'),
    [filteredAccessibleSites]
  )
  const rentedSiteOptions = useMemo(
    () => filteredAccessibleSites.filter((site) => site.source === 'RENTED'),
    [filteredAccessibleSites]
  )

  const selectedSite = useMemo(() => {
    return accessibleSites.find((site) => site.id === form.siteId)
  }, [accessibleSites, form.siteId])

  const selectedProvider = useMemo(() => {
    return providers?.find((provider) => provider.id === form.providerId)
  }, [providers, form.providerId])

  useEffect(() => {
    if (form.siteId || loadingSiteOptions) return
    if (accessibleSites.length !== 1) return
    setForm((prev) => ({ ...prev, siteId: accessibleSites[0].id }))
  }, [accessibleSites, form.siteId, loadingSiteOptions])

  const relationshipByProvider = useMemo(() => {
    const map = new Map<string, ProviderRelationship>()
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
  }, [relationships])

  const eligibleProviders = useMemo(() => {
    return (providers ?? []).filter((provider) => {
      if (normalizeProviderStatus(provider.status) !== 'APPROVED') return false
      const relationshipStatus = normalizeRelationshipStatus(relationshipByProvider.get(provider.id)?.status)
      return relationshipStatus === 'ACTIVE'
    })
  }, [providers, relationshipByProvider])

  const unavailableProviders = useMemo(() => {
    return (providers ?? [])
      .map((provider) => {
        const relationship = relationshipByProvider.get(provider.id)
        const reason = providerUnavailableReason(provider, relationship)
        if (!reason) return null
        const relationshipStatus = normalizeRelationshipStatus(relationship?.status)
        const canRequest = relationshipStatus === 'NONE' && normalizeProviderStatus(provider.status) === 'APPROVED'
        return { provider, reason, canRequest }
      })
      .filter((entry): entry is { provider: SwapProvider; reason: string; canRequest: boolean } => entry !== null)
  }, [providers, relationshipByProvider])

  useEffect(() => {
    if (!form.providerId) return
    const stillEligible = eligibleProviders.some((provider) => provider.id === form.providerId)
    if (!stillEligible) {
      setForm((prev) => ({ ...prev, providerId: '' }))
    }
  }, [eligibleProviders, form.providerId])

  const toast = (message: string) => {
    setAck(message)
    setTimeout(() => setAck(''), 2000)
  }

  const updateForm = <K extends keyof SwapStationForm>(key: K, value: SwapStationForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateBayCount = (nextCount: number) => {
    const safeCount = Math.max(0, Math.min(999, nextCount))
    setForm((prev) => ({
      ...prev,
      bayCount: safeCount,
      bays: buildBays(safeCount, prev.bays),
    }))
  }

  const updateBayBattery = (index: number, batteryId: string) => {
    setForm((prev) => ({
      ...prev,
      bays: prev.bays.map((bay, idx) => (idx === index ? { ...bay, batteryId } : bay)),
    }))
  }

  const assignScanToNextBay = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setForm((prev) => {
      const nextIndex = prev.bays.findIndex((bay) => !bay.batteryId)
      if (nextIndex === -1) {
        toast('All bays already have batteries assigned.')
        return prev
      }
      const updated = prev.bays.map((bay, idx) => (idx === nextIndex ? { ...bay, batteryId: trimmed } : bay))
      return { ...prev, bays: updated }
    })
    setScanValue('')
  }

  const toggleProtocol = (protocol: Protocol) => {
    setForm((prev) => {
      const exists = prev.protocols.includes(protocol)
      return {
        ...prev,
        protocols: exists ? prev.protocols.filter((p) => p !== protocol) : [...prev.protocols, protocol],
      }
    })
  }

  const simulateConnect = () => {
    setConnectState('connecting')
    setTimeout(() => {
      setConnectState('connected')
      toast('Hub connected.')
    }, 1500)
  }

  const detectBays = () => {
    const detected = 12
    updateBayCount(detected)
    toast(`Detected ${detected} bays.`)
  }

  const getAssignedCount = () => form.bays.filter((bay) => bay.batteryId.trim()).length

  const duplicateBatteryIds = () => {
    const ids = form.bays.map((bay) => bay.batteryId.trim()).filter(Boolean)
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) dupes.add(id)
      else seen.add(id)
    }
    return Array.from(dupes)
  }

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!form.siteId && !!form.name && !!form.providerId
      case 1:
        if (form.hardwareMode === 'MANUAL') return true
        if (!form.protocols.length) return false
        if (!form.gatewayId) return false
        if (form.protocols.includes('MQTT') && !form.mqttBroker) return false
        if (form.protocols.includes('HTTP') && !form.httpEndpoint) return false
        return connectState === 'connected'
      case 2:
        return form.bayCount > 0
      case 3:
        return getAssignedCount() > 0 && duplicateBatteryIds().length === 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      if (!selectedSite) throw new Error('Selected site not found')

      const tags = [
        `Swap:${form.vehicleType}`,
        `Hardware:${form.hardwareMode}`,
        ...form.protocols.map((p) => `Protocol:${p}`),
      ]

      const newStation = await createStationMutation.mutateAsync({
        code: `SW-${Date.now()}`,
        name: form.name,
        address: selectedSite.address || '',
        latitude: selectedSite.latitude ?? 0,
        longitude: selectedSite.longitude ?? 0,
        type: 'SWAP',
        siteId: form.siteId,
        orgId: viewerOrgId,
        ownerId: user?.id,
        providerId: form.providerId,
        capacity: form.bayCount,
        parkingBays: form.bayCount,
        tags,
      })

      await upsertSwapBaysMutation.mutateAsync({
        stationId: newStation.id,
        bays: form.bays.map((bay) => ({
          id: bay.id,
          batteryId: bay.batteryId || undefined,
          status: bay.batteryId ? 'Occupied' : 'Available',
        })),
      })

      const defaultBatteryType = selectedProvider?.batteriesSupported?.[0] || 'Unknown'
      const stationBatteries = form.bays
        .filter((bay) => bay.batteryId.trim())
        .map((bay) => ({
          id: bay.batteryId.trim(),
          type: defaultBatteryType,
          soc: 100,
          health: 100,
          status: 'Ready' as const,
          location: bay.id,
          stationId: newStation.id,
          bayId: bay.id,
          providerId: form.providerId,
        }))

      await upsertStationBatteriesMutation.mutateAsync({
        stationId: newStation.id,
        batteries: stationBatteries,
      })

      auditLogger.stationCreated(newStation.id, newStation.name)
      navigate(PATHS.STATIONS.SWAP_STATIONS)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  const requestProviderPartnership = async (providerId: string) => {
    if (!ownerOrgId) {
      setError('Your account has no organization ID. Contact admin to complete organization setup.')
      return
    }

    try {
      await requestRelationshipMutation.mutateAsync({ providerId, ownerOrgId })
      toast('Provider partnership request submitted.')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const isRedirecting = !meLoading && !canCreateSwap && (stationCreationContext.requiresOwnerCapabilityChoice || canCreateCharge)

  if (isRedirecting) {
    return (
      <DashboardLayout pageTitle="Add Swap Station">
        <div className="p-8 text-center text-subtle">Redirecting to the correct station wizard...</div>
      </DashboardLayout>
    )
  }

  if (!meLoading && !canCreateSwap) {
    return (
      <DashboardLayout pageTitle="Add Swap Station">
        <div className="p-8 text-center text-subtle">No permission to add swap stations.</div>
      </DashboardLayout>
    )
  }

  if (!loadingSiteOptions && accessibleSites.length === 0) {
    return (
      <DashboardLayout pageTitle="Add Swap Station">
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="bg-surface border border-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4">No Sites Available</h2>
            <p className="text-subtle mb-6">
              You need at least one owned site or an active signed rental (LEASE_SIGNED/COMPLETED) before adding a swap station.
            </p>
            <button onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)} className="btn primary w-full">
              Apply for a Site / Add Site
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Add Swap Station">
      <div className="max-w-3xl mx-auto space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  i < step ? 'bg-accent text-white' : i === step ? 'bg-accent text-white ring-4 ring-accent/20' : 'bg-muted text-subtle'
                }`}
              >
                {i < step ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`ml-2 text-sm ${i <= step ? 'font-medium' : 'text-subtle'}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`mx-4 h-0.5 w-12 ${i < step ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-surface border border-border p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Station Basics</h3>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Site *</span>
                {loadingSiteOptions ? (
                  <InlineSkeleton width="100%" height={40} />
                ) : (
                  <div className="space-y-2">
                    <input
                      value={siteSearch}
                      onChange={(e) => setSiteSearch(e.target.value)}
                      placeholder="Search site by name or address..."
                      className="input"
                    />
                    <div className="text-xs text-subtle">
                      Showing {filteredAccessibleSites.length} of {accessibleSites.length} accessible sites
                    </div>
                    <select
                      value={form.siteId}
                      onChange={(e) => updateForm('siteId', e.target.value)}
                      className="select"
                    >
                      <option value="">Choose a site...</option>
                      {ownedSiteOptions.length > 0 && (
                        <optgroup label="Owned Sites">
                          {ownedSiteOptions.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.name} {site.address ? `(${site.address})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {rentedSiteOptions.length > 0 && (
                        <optgroup label="Rented Sites">
                          {rentedSiteOptions.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.name} {site.address ? `(${site.address})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {filteredAccessibleSites.length === 0 && (
                      <div className="text-xs text-subtle">No matching sites found for your search.</div>
                    )}
                  </div>
                )}
              </label>

              {selectedSite && (
                <div className="rounded-lg border border-white/5 bg-panel/40 p-4 text-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium text-text">Site location (inherited)</div>
                    <span className="text-[11px] px-2 py-0.5 rounded border border-white/10 bg-white/5 uppercase tracking-wide">
                      {selectedSite.source === 'OWNED' ? 'Owned' : 'Rented'}
                    </span>
                  </div>
                  <div className="text-subtle">{selectedSite.address || 'No address on record'}</div>
                  <div className="text-subtle">
                    Lat: {selectedSite.latitude ?? 0}, Lng: {selectedSite.longitude ?? 0}
                  </div>
                </div>
              )}

              <label className="grid gap-1">
                <span className="text-sm font-medium">Station name *</span>
                <input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  className="input"
                  placeholder="e.g. Central Swap Hub"
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Vehicle type *</span>
                  <select value={form.vehicleType} onChange={(e) => updateForm('vehicleType', e.target.value as VehicleType)} className="select">
                    <option value="BIKE">Two-wheeler (bikes)</option>
                    <option value="CAR">Cars</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Battery provider *</span>
                  {loadingProviders ? (
                    <InlineSkeleton width="100%" height={40} />
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={form.providerId}
                        onChange={(e) => updateForm('providerId', e.target.value)}
                        className="select"
                      >
                        <option value="">Choose an active contracted provider...</option>
                        {eligibleProviders.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                      {eligibleProviders.length === 0 && (
                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700">
                          No active provider contracts found for your organization. Request a provider below.
                        </div>
                      )}
                      {unavailableProviders.length > 0 && (
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {unavailableProviders.slice(0, 4).map(({ provider, reason, canRequest }) => (
                            <div key={provider.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-panel/30 px-2 py-1.5">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-text truncate">{provider.name}</div>
                                <div className="text-[11px] text-subtle truncate">{reason}</div>
                              </div>
                              {canRequest && (
                                <button
                                  type="button"
                                  className="px-2 py-1 text-[11px] rounded border border-accent/40 text-accent hover:bg-accent hover:text-white transition-colors disabled:opacity-60"
                                  onClick={() => requestProviderPartnership(provider.id)}
                                  disabled={requestRelationshipMutation.isPending}
                                >
                                  Request
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Connectivity</h3>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Hardware mode *</span>
                <select
                  value={form.hardwareMode}
                  onChange={(e) => {
                    const mode = e.target.value as HardwareMode
                    updateForm('hardwareMode', mode)
                    setConnectState('idle')
                  }}
                  className="select"
                >
                  <option value="COMPUTERIZED">Computerized (auto-detect bays)</option>
                  <option value="MANUAL">Manual (enter bay count)</option>
                </select>
              </label>

              {form.hardwareMode === 'COMPUTERIZED' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium">Gateway ID *</span>
                      <input value={form.gatewayId} onChange={(e) => updateForm('gatewayId', e.target.value)} className="input" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium">Auth token</span>
                      <input value={form.authToken} onChange={(e) => updateForm('authToken', e.target.value)} className="input" />
                    </label>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Protocols *</div>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.protocols.includes('MQTT')}
                          onChange={() => toggleProtocol('MQTT')}
                          className="rounded border-border"
                        />
                        MQTT
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.protocols.includes('HTTP')}
                          onChange={() => toggleProtocol('HTTP')}
                          className="rounded border-border"
                        />
                        HTTP
                      </label>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium">MQTT broker URL</span>
                      <input
                        value={form.mqttBroker}
                        onChange={(e) => updateForm('mqttBroker', e.target.value)}
                        className="input"
                        disabled={!form.protocols.includes('MQTT')}
                        placeholder="mqtts://broker.example.com"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium">HTTP endpoint</span>
                      <input
                        value={form.httpEndpoint}
                        onChange={(e) => updateForm('httpEndpoint', e.target.value)}
                        className="input"
                        disabled={!form.protocols.includes('HTTP')}
                        placeholder="https://api.example.com/swap"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-panel/40 p-4 text-sm">
                    <div>
                      <div className="font-medium">Connection status</div>
                      <div className="text-subtle">
                        {connectState === 'idle' && 'Not connected'}
                        {connectState === 'connecting' && 'Connecting to hub...'}
                        {connectState === 'connected' && 'Connected'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={simulateConnect}
                      disabled={connectState === 'connecting' || !form.gatewayId || !form.protocols.length}
                      className="btn secondary"
                    >
                      {connectState === 'connecting' ? 'Connecting...' : 'Test connection'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Bays</h3>

              {form.hardwareMode === 'COMPUTERIZED' ? (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-panel/40 p-4 text-sm">
                    <div>
                      <div className="font-medium">Auto-detect bays</div>
                      <div className="text-subtle">Detect bay count from the connected hub.</div>
                    </div>
                    <button
                      type="button"
                      onClick={detectBays}
                      disabled={connectState !== 'connected'}
                      className="btn secondary"
                    >
                      Detect bays
                    </button>
                  </div>
                  <div className="text-sm text-subtle">Detected bays: {form.bayCount || 'Not detected yet'}</div>
                </>
              ) : (
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Number of bays *</span>
                  <input
                    type="number"
                    min="1"
                    value={form.bayCount || ''}
                    onChange={(e) => updateBayCount(Number(e.target.value) || 0)}
                    className="input"
                  />
                </label>
              )}

              {form.bayCount > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Bay IDs (auto formatted)</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {form.bays.map((bay) => (
                      <div key={bay.id} className="rounded-lg border border-white/5 bg-panel/30 px-3 py-2 text-sm font-mono">
                        {bay.id}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Inventory</h3>
              <p className="text-sm text-subtle">Scan battery QR codes to assign battery IDs to bays.</p>

              <div className="flex items-center gap-2">
                <input
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      assignScanToNextBay(scanValue)
                    }
                  }}
                  className="input flex-1"
                  placeholder="Scan QR code and press Enter"
                />
                <button type="button" onClick={() => assignScanToNextBay(scanValue)} className="btn secondary">
                  Assign
                </button>
              </div>

              {duplicateBatteryIds().length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  Duplicate battery IDs detected: {duplicateBatteryIds().join(', ')}
                </div>
              )}

              <div className="text-sm text-subtle">Assigned {getAssignedCount()} of {form.bayCount} bays.</div>

              <div className="grid sm:grid-cols-2 gap-3">
                {form.bays.map((bay, idx) => (
                  <div key={bay.id} className="rounded-lg border border-white/5 bg-panel/30 p-3">
                    <div className="text-xs text-subtle mb-1">Bay {bay.id}</div>
                    <input
                      value={bay.batteryId}
                      onChange={(e) => updateBayBattery(idx, e.target.value)}
                      className="input"
                      placeholder="Battery ID"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-subtle">Station</div>
                  <div className="font-medium">{form.name}</div>
                </div>
                <div>
                  <div className="text-subtle">Site</div>
                  <div className="font-medium">{selectedSite?.name || form.siteId}</div>
                </div>
                <div>
                  <div className="text-subtle">Vehicle type</div>
                  <div className="font-medium">{form.vehicleType}</div>
                </div>
                <div>
                  <div className="text-subtle">Provider</div>
                  <div className="font-medium">{providers?.find((p) => p.id === form.providerId)?.name || form.providerId}</div>
                </div>
                <div>
                  <div className="text-subtle">Hardware mode</div>
                  <div className="font-medium">{form.hardwareMode}</div>
                </div>
                <div>
                  <div className="text-subtle">Protocols</div>
                  <div className="font-medium">{form.protocols.length ? form.protocols.join(', ') : 'None'}</div>
                </div>
                <div>
                  <div className="text-subtle">Bays</div>
                  <div className="font-medium">{form.bayCount}</div>
                </div>
                <div>
                  <div className="text-subtle">Batteries assigned</div>
                  <div className="font-medium">{getAssignedCount()}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`px-4 py-2 rounded-lg border border-border ${step === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-2 rounded-lg font-medium ${canProceed() ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="px-6 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Create Swap Station'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

