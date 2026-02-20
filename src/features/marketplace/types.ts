import type { Organization, Site, SwapProvider, User } from '@/core/api/types'
import type { NormalizedProviderStatus, NormalizedRelationshipStatus } from '@/modules/integrations/providerStatus'

export type MarketplaceEntityKind = 'Sites' | 'Operators' | 'Technicians' | 'Providers'

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

export type SiteListing = MarketplaceSummaryListing & {
  kind: 'Sites'
  powerCapacityKw: number
  leaseType?: string
  expectedMonthlyPrice?: number
  expectedFootfall?: string
  owner?: Site['owner']
}

export type PeopleListing = MarketplaceSummaryListing & {
  kind: 'Operators' | 'Technicians'
  email?: string
  phone?: string
  role: User['role']
}

export type ListingsMarketplaceListing = SiteListing | PeopleListing

export type ProviderRelationshipBadgeStatus = NormalizedRelationshipStatus | 'N/A'

export type ProviderListing = MarketplaceSummaryListing & {
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

export type UnifiedMarketplaceListing = SiteListing | PeopleListing | ProviderListing

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
  entity: (Site & Record<string, unknown>) | (User & Record<string, unknown>) | (SwapProvider & Record<string, unknown>)
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
