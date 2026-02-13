import type { Organization, Site, User } from '@/core/api/types'

export type MarketplaceEntityKind = 'Sites' | 'Operators' | 'Technicians'

export type MarketplaceDocumentStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'INFO_REQUESTED'
  | 'LEGACY'

export type MarketplaceDocument = {
  id: string
  fileName: string
  fileUrl: string
  category?: string
  uploadedAt?: string
  status: MarketplaceDocumentStatus
  source: 'GENERIC' | 'LEGACY'
}

export type MarketplaceSummaryListing = {
  id: string
  kind: MarketplaceEntityKind
  name: string
  city: string
  region: string
}

export type MarketplaceTechnicianAvailability = {
  id: string
  userId: string
  status: string
  location?: string
  lastPulse?: string
}

export type MarketplaceDetailsResult = {
  kind: MarketplaceEntityKind
  listing: MarketplaceSummaryListing
  entity: (Site & Record<string, unknown>) | (User & Record<string, unknown>)
  organization: Organization | null
  documents: MarketplaceDocument[]
  rating: number | null
  status: string | null
  contact: {
    email?: string
    phone?: string
  }
  availability?: MarketplaceTechnicianAvailability | null
}
