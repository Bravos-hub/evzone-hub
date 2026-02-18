export type NormalizedProviderStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'UNKNOWN'

export type NormalizedRelationshipStatus =
  | 'REQUESTED'
  | 'PROVIDER_ACCEPTED'
  | 'DOCS_PENDING'
  | 'ADMIN_APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'NONE'
  | 'UNKNOWN'

export function normalizeProviderStatus(status?: string): NormalizedProviderStatus {
  const normalized = (status ?? '').toUpperCase().trim()
  if (normalized === 'ACTIVE') return 'APPROVED'
  if (normalized === 'PENDING') return 'PENDING_REVIEW'
  if (normalized === 'INACTIVE') return 'SUSPENDED'
  if (normalized === 'REJECTED') return 'REJECTED'
  if (normalized === 'SUSPENDED') return 'SUSPENDED'
  if (normalized === 'APPROVED') return 'APPROVED'
  if (normalized === 'PENDING_REVIEW') return 'PENDING_REVIEW'
  if (normalized === 'DRAFT') return 'DRAFT'
  return 'UNKNOWN'
}

export function normalizeRelationshipStatus(status?: string): NormalizedRelationshipStatus {
  const normalized = (status ?? '').toUpperCase().trim()
  if (!normalized) return 'NONE'
  if (normalized === 'REQUESTED') return 'REQUESTED'
  if (normalized === 'PROVIDER_ACCEPTED') return 'PROVIDER_ACCEPTED'
  if (normalized === 'DOCS_PENDING') return 'DOCS_PENDING'
  if (normalized === 'ADMIN_APPROVED') return 'ADMIN_APPROVED'
  if (normalized === 'ACTIVE') return 'ACTIVE'
  if (normalized === 'SUSPENDED') return 'SUSPENDED'
  if (normalized === 'TERMINATED') return 'TERMINATED'
  return 'UNKNOWN'
}

export function humanizeProviderStatus(status: string): string {
  if (status === 'NONE') return 'No relationship'
  if (status === 'UNKNOWN') return 'Unknown'
  return status.replace(/_/g, ' ')
}

