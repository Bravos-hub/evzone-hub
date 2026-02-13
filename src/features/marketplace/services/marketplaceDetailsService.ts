import { apiClient } from '@/core/api/client'
import type { Organization, Site, User } from '@/core/api/types'
import type {
  MarketplaceDetailsResult,
  MarketplaceDocument,
  MarketplaceDocumentStatus,
  MarketplaceSummaryListing,
  MarketplaceTechnicianAvailability,
} from '../types'

type GenericDocumentApi = {
  id: string
  category?: string
  fileName: string
  fileUrl: string
  status?: string
  uploadedAt?: string
  createdAt?: string
}

type LegacySiteDocumentApi = {
  id: string
  title?: string
  fileName: string
  fileUrl: string
  uploadedAt?: string
}

const DOCUMENT_STATUS_SET = new Set<MarketplaceDocumentStatus>([
  'VERIFIED',
  'PENDING',
  'REJECTED',
  'EXPIRED',
  'INFO_REQUESTED',
  'LEGACY',
])

function normalizeDocumentStatus(status?: string): MarketplaceDocumentStatus {
  const normalized = status?.toUpperCase()
  if (normalized && DOCUMENT_STATUS_SET.has(normalized as MarketplaceDocumentStatus)) {
    return normalized as MarketplaceDocumentStatus
  }
  return 'PENDING'
}

function mapGenericDocument(doc: GenericDocumentApi): MarketplaceDocument {
  return {
    id: doc.id,
    fileName: doc.fileName,
    fileUrl: doc.fileUrl,
    category: doc.category,
    uploadedAt: doc.uploadedAt || doc.createdAt,
    status: normalizeDocumentStatus(doc.status),
    source: 'GENERIC',
  }
}

function mapLegacySiteDocument(doc: LegacySiteDocumentApi): MarketplaceDocument {
  return {
    id: doc.id,
    fileName: doc.fileName || doc.title || 'Untitled document',
    fileUrl: doc.fileUrl,
    uploadedAt: doc.uploadedAt,
    status: 'LEGACY',
    source: 'LEGACY',
  }
}

function mergeDocuments(genericDocs: MarketplaceDocument[], legacyDocs: MarketplaceDocument[]) {
  const seen = new Set(genericDocs.map((doc) => `${doc.fileUrl}::${doc.fileName}`))
  const merged = [...genericDocs]
  for (const legacyDoc of legacyDocs) {
    const key = `${legacyDoc.fileUrl}::${legacyDoc.fileName}`
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(legacyDoc)
    }
  }
  return merged
}

async function fetchOrganization(organizationId?: string | null): Promise<Organization | null> {
  if (!organizationId) return null
  try {
    return await apiClient.get<Organization>(`/organizations/${organizationId}`)
  } catch {
    return null
  }
}

async function fetchGenericDocuments(entityType: 'SITE' | 'USER', entityId: string): Promise<MarketplaceDocument[]> {
  try {
    const docs = await apiClient.get<GenericDocumentApi[]>(`/documents/${entityType}/${entityId}`)
    return docs.map(mapGenericDocument)
  } catch {
    return []
  }
}

async function fetchLegacySiteDocuments(siteId: string): Promise<MarketplaceDocument[]> {
  try {
    const docs = await apiClient.get<LegacySiteDocumentApi[]>(`/sites/${siteId}/documents`)
    return docs.map(mapLegacySiteDocument)
  } catch {
    return []
  }
}

async function fetchTechnicianAvailability(userId: string): Promise<MarketplaceTechnicianAvailability | null> {
  try {
    const rows = await apiClient.get<MarketplaceTechnicianAvailability[]>('/technicians/availability')
    return rows.find((row) => row.userId === userId) || null
  } catch {
    return null
  }
}

function resolveRating(entity: Record<string, unknown>): number | null {
  const value = entity.rating
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

export const marketplaceDetailsService = {
  async getDetails(listing: MarketplaceSummaryListing): Promise<MarketplaceDetailsResult> {
    if (listing.kind === 'Sites') {
      const site = await apiClient.get<Site & Record<string, unknown>>(`/sites/${listing.id}`)
      const [genericDocs, legacyDocs, organization] = await Promise.all([
        fetchGenericDocuments('SITE', listing.id),
        fetchLegacySiteDocuments(listing.id),
        fetchOrganization(site.organizationId),
      ])

      return {
        kind: listing.kind,
        listing,
        entity: site,
        organization,
        documents: mergeDocuments(genericDocs, legacyDocs),
        rating: resolveRating(site),
        status: (typeof site.verificationStatus === 'string' ? site.verificationStatus : site.status) || null,
        contact: {
          email: site.owner?.email || undefined,
          phone: site.owner?.phone || undefined,
        },
        availability: null,
      }
    }

    const user = await apiClient.get<User & Record<string, unknown>>(`/users/${listing.id}`)
    const embeddedOrganization = user.organization
      ? ({
          id: user.organization.id,
          name: user.organization.name,
          type: user.organization.type,
          city: user.organization.city || undefined,
          address: user.organization.address || undefined,
          logoUrl: user.organization.logoUrl || undefined,
          createdAt: user.createdAt || '',
          updatedAt: user.updatedAt,
        } satisfies Organization)
      : null
    const [documents, organizationFallback, availability] = await Promise.all([
      fetchGenericDocuments('USER', listing.id),
      embeddedOrganization ? Promise.resolve(null) : fetchOrganization(user.organizationId),
      listing.kind === 'Technicians' ? fetchTechnicianAvailability(listing.id) : Promise.resolve(null),
    ])

    return {
      kind: listing.kind,
      listing,
      entity: user,
      organization: embeddedOrganization || organizationFallback,
      documents,
      rating: resolveRating(user),
      status: (availability?.status || user.status || null) as string | null,
      contact: {
        email: user.email || undefined,
        phone: user.phone || undefined,
      },
      availability,
    }
  },
}
