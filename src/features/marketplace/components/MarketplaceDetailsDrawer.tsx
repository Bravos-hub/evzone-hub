import { useEffect, useMemo, useState } from 'react'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import { useMarketplaceDetails } from '../hooks/useMarketplaceDetails'
import type {
  MarketplaceDetailsResult,
  MarketplaceDocument,
  MarketplaceDocumentStatus,
  MarketplaceSummaryListing,
} from '../types'

type DetailsTab = 'overview' | 'organization' | 'documents' | 'contact' | 'other'

type MarketplaceDetailsDrawerProps = {
  listing: MarketplaceSummaryListing | null
  open: boolean
  canApplyToSite: boolean
  onClose: () => void
  onApplySite: (siteId: string) => void
}

const TABS: Array<{ id: DetailsTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'organization', label: 'Organization' },
  { id: 'documents', label: 'Documents' },
  { id: 'contact', label: 'Contact' },
  { id: 'other', label: 'Other Details' },
]

const STATUS_ORDER: MarketplaceDocumentStatus[] = [
  'VERIFIED',
  'PENDING',
  'REJECTED',
  'INFO_REQUESTED',
  'EXPIRED',
  'LEGACY',
]

const SENSITIVE_KEYS = new Set([
  'passwordHash',
  'otpCode',
  'otpExpiresAt',
  'clientSecretHash',
  'clientSecretSalt',
  'refreshToken',
  'accessToken',
])

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (s) => s.toUpperCase())
}

function formatValue(value: unknown): string {
  if (value == null) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    if (value.length === 0) return 'N/A'
    if (value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))) {
      return value.join(', ')
    }
    return `${value.length} items`
  }
  if (typeof value === 'object') {
    const text = JSON.stringify(value)
    return text.length > 140 ? `${text.slice(0, 140)}...` : text
  }
  return String(value)
}

function toDateLabel(value: unknown): string {
  if (!value || typeof value !== 'string') return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

function useOtherDetails(data: MarketplaceDetailsResult | undefined) {
  return useMemo(() => {
    if (!data?.entity) return []
    const entity = data.entity as Record<string, unknown>
    const excluded = new Set<string>([
      'id',
      'name',
      'email',
      'phone',
      'role',
      'status',
      'region',
      'country',
      'city',
      'address',
      'purpose',
      'powerCapacityKw',
      'parkingBays',
      'leaseType',
      'expectedMonthlyPrice',
      'expectedFootfall',
      'leaseDetails',
      'owner',
      'documents',
      'organization',
      'organizationId',
      'createdAt',
      'updatedAt',
      'verificationStatus',
      'documentsVerified',
      'documentsVerifiedAt',
      'documentsVerifiedBy',
      'ownerCapability',
      'subscribedPackage',
      'postalCode',
      'avatarUrl',
      '_count',
      'applications',
      'reviewedApplications',
      'wallet',
      'invoices',
      'bookings',
      'sites',
      'ownedStations',
      'operatedStations',
      'uploadedDocuments',
      'verifiedDocuments',
      'assignedJobs',
      'technicianStatus',
      'zone',
      'zoneId',
      'metadata',
    ])

    return Object.entries(entity)
      .filter(([key, value]) => {
        if (excluded.has(key) || SENSITIVE_KEYS.has(key)) return false
        if (value == null) return false
        if (typeof value === 'string' && value.trim() === '') return false
        if (Array.isArray(value) && value.length === 0) return false
        return true
      })
      .map(([key, value]) => ({
        key,
        label: humanizeKey(key),
        value: formatValue(value),
      }))
  }, [data])
}

function DocumentStatusPill({ status }: { status: MarketplaceDocumentStatus }) {
  const classes: Record<MarketplaceDocumentStatus, string> = {
    VERIFIED: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-700',
    INFO_REQUESTED: 'bg-blue-100 text-blue-700',
    EXPIRED: 'bg-gray-200 text-gray-700',
    LEGACY: 'bg-slate-100 text-slate-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${classes[status]}`}>{status}</span>
}

function DocumentsTab({ documents }: { documents: MarketplaceDocument[] }) {
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: documents.filter((doc) => doc.status === status).length,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {counts.map((row) => (
          <div key={row.status} className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted">{row.status}</div>
            <div className="text-lg font-semibold">{row.count}</div>
          </div>
        ))}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
          No documents available.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={`${doc.source}:${doc.id}`} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm break-all">{doc.fileName}</div>
                  <div className="text-xs text-muted mt-1">
                    {doc.category || 'Uncategorized'} • {doc.uploadedAt ? toDateLabel(doc.uploadedAt) : 'No upload date'}
                  </div>
                </div>
                <DocumentStatusPill status={doc.status} />
              </div>
              <div className="mt-2">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Open Document
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function MarketplaceDetailsDrawer({
  listing,
  open,
  canApplyToSite,
  onClose,
  onApplySite,
}: MarketplaceDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DetailsTab>('overview')
  const [contactNotice, setContactNotice] = useState<string | null>(null)
  const { data, isLoading, isError, error } = useMarketplaceDetails(listing, open)
  const otherDetails = useOtherDetails(data)

  useEffect(() => {
    setActiveTab('overview')
    setContactNotice(null)
  }, [listing?.id, listing?.kind])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  if (!open || !listing) return null

  const entity = (data?.entity || {}) as Record<string, unknown>
  const leaseDetails = ((entity.leaseDetails as Record<string, unknown>) || {}) as Record<string, unknown>
  const hasSiteKind = listing.kind === 'Sites'
  const contactEmail = data?.contact.email
  const contactPhone = data?.contact.phone
  const ratingLabel = data?.rating == null ? 'Not provided' : String(data.rating)
  const stateLabel = data?.status || 'Unknown'

  const copyContact = async (value: string | undefined, label: string) => {
    if (!value) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setContactNotice(`${label} copied to clipboard.`)
    } catch {
      setContactNotice(`Unable to copy ${label.toLowerCase()}.`)
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/35"
        aria-label="Close details panel"
        onClick={onClose}
      />

      <aside className="absolute inset-0 lg:inset-y-0 lg:right-0 lg:left-auto w-full lg:max-w-xl bg-surface border-l border-border shadow-2xl flex flex-col">
        <header className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted">{listing.kind}</div>
              <h2 className="text-lg font-bold">{listing.name}</h2>
              <div className="text-sm text-muted">{listing.city} • {listing.region}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="pill neutral">{stateLabel}</span>
                <span className="pill neutral">Rating: {ratingLabel}</span>
              </div>
            </div>
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        <nav className="px-4 pt-3 flex gap-2 overflow-x-auto border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm rounded-t-lg whitespace-nowrap ${
                activeTab === tab.id ? 'bg-muted/60 text-text font-semibold' : 'text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading && (
            <div className="space-y-3">
              <TextSkeleton lines={2} />
              <TextSkeleton lines={4} />
            </div>
          )}

          {!isLoading && isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-4 text-sm">
              Failed to load details. {String((error as Error)?.message || '')}
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {hasSiteKind ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Purpose</div>
                          <div className="font-semibold">{formatValue(entity.purpose)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Verification</div>
                          <div className="font-semibold">{formatValue(entity.verificationStatus || entity.status)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3 col-span-2">
                          <div className="text-xs text-muted">Address</div>
                          <div className="font-semibold">{formatValue(entity.address)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Power Capacity</div>
                          <div className="font-semibold">{formatValue(entity.powerCapacityKw)} kW</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Parking Bays</div>
                          <div className="font-semibold">{formatValue(entity.parkingBays)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Lease Type</div>
                          <div className="font-semibold">{formatValue(leaseDetails.leaseType || entity.leaseType)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Expected Monthly Price</div>
                          <div className="font-semibold">
                            {formatValue(leaseDetails.expectedMonthlyPrice ?? entity.expectedMonthlyPrice ?? 'Not provided')}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border p-4">
                        <div className="text-sm font-semibold mb-2">Owner Summary</div>
                        <div className="text-sm text-muted">Name: {formatValue((entity.owner as any)?.name)}</div>
                        <div className="text-sm text-muted">Email: {formatValue((entity.owner as any)?.email)}</div>
                        <div className="text-sm text-muted">Phone: {formatValue((entity.owner as any)?.phone)}</div>
                        <div className="text-sm text-muted">Region: {formatValue((entity.owner as any)?.region)}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Role</div>
                          <div className="font-semibold">{formatValue(entity.role)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Status</div>
                          <div className="font-semibold">{formatValue(data.status)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Region</div>
                          <div className="font-semibold">{formatValue(entity.region)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Country</div>
                          <div className="font-semibold">{formatValue(entity.country)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Package</div>
                          <div className="font-semibold">{formatValue(entity.subscribedPackage)}</div>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <div className="text-xs text-muted">Capability</div>
                          <div className="font-semibold">{formatValue(entity.ownerCapability)}</div>
                        </div>
                      </div>

                      {data.availability && (
                        <div className="rounded-lg border border-border p-4">
                          <div className="text-sm font-semibold mb-2">Live Availability</div>
                          <div className="text-sm text-muted">Status: {formatValue(data.availability.status)}</div>
                          <div className="text-sm text-muted">Location: {formatValue(data.availability.location)}</div>
                          <div className="text-sm text-muted">Last Pulse: {toDateLabel(data.availability.lastPulse)}</div>
                        </div>
                      )}
                    </>
                  )}

                  <div className="rounded-lg border border-border p-4">
                    <div className="text-xs text-muted">Created At</div>
                    <div className="font-semibold text-sm">{toDateLabel(entity.createdAt)}</div>
                    <div className="text-xs text-muted mt-2">Updated At</div>
                    <div className="font-semibold text-sm">{toDateLabel(entity.updatedAt)}</div>
                  </div>
                </div>
              )}

              {activeTab === 'organization' && (
                <div className="space-y-4">
                  {data.organization ? (
                    <>
                      <div className="rounded-lg border border-border p-4">
                        <div className="text-sm font-semibold">{data.organization.name}</div>
                        <div className="text-xs text-muted mt-1">Type: {data.organization.type}</div>
                        <div className="text-xs text-muted">City: {data.organization.city || 'N/A'}</div>
                        <div className="text-xs text-muted">Address: {data.organization.address || 'N/A'}</div>
                      </div>
                      {data.organization.logoUrl && (
                        <div className="rounded-lg border border-border p-4">
                          <div className="text-xs text-muted mb-2">Logo</div>
                          <img
                            src={data.organization.logoUrl}
                            alt={`${data.organization.name} logo`}
                            className="h-16 object-contain"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
                      No organization assigned.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && <DocumentsTab documents={data.documents} />}

              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm text-muted">Email</div>
                    <div className="font-semibold break-all">{contactEmail || 'Unavailable'}</div>
                    <div className="text-sm text-muted mt-3">Phone</div>
                    <div className="font-semibold">{contactPhone || 'Unavailable'}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={contactEmail ? `mailto:${contactEmail}` : undefined}
                      className={`btn secondary ${contactEmail ? '' : 'opacity-50 pointer-events-none'}`}
                    >
                      Email
                    </a>
                    <a
                      href={contactPhone ? `tel:${contactPhone}` : undefined}
                      className={`btn secondary ${contactPhone ? '' : 'opacity-50 pointer-events-none'}`}
                    >
                      Call
                    </a>
                    <button
                      className={`btn secondary ${contactEmail ? '' : 'opacity-50'}`}
                      disabled={!contactEmail}
                      onClick={() => copyContact(contactEmail, 'Email')}
                    >
                      Copy Email
                    </button>
                    <button
                      className={`btn secondary ${contactPhone ? '' : 'opacity-50'}`}
                      disabled={!contactPhone}
                      onClick={() => copyContact(contactPhone, 'Phone')}
                    >
                      Copy Phone
                    </button>
                  </div>
                  {!contactEmail && !contactPhone && (
                    <div className="text-sm text-red-600">
                      No direct contact details are available for this listing yet.
                    </div>
                  )}
                  {contactNotice && <div className="text-sm text-muted">{contactNotice}</div>}
                </div>
              )}

              {activeTab === 'other' && (
                <div className="space-y-2">
                  {otherDetails.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
                      No additional populated fields were found.
                    </div>
                  ) : (
                    otherDetails.map((item) => (
                      <div key={item.key} className="rounded-lg border border-border p-3">
                        <div className="text-xs text-muted">{item.label}</div>
                        <div className="text-sm font-medium break-all">{item.value}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <footer className="border-t border-border px-4 py-3 flex justify-end gap-2">
          {hasSiteKind && canApplyToSite && (
            <button className="btn primary" onClick={() => onApplySite(listing.id)}>
              Apply for this Site
            </button>
          )}
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </aside>
    </div>
  )
}
