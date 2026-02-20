import { humanizeProviderStatus } from '@/modules/integrations/providerStatus'
import type { NormalizedProviderStatus, NormalizedRelationshipStatus } from '@/modules/integrations/providerStatus'
import type { MarketplaceEntityKind } from './types'

export type ProviderRelationshipBadgeStatus = NormalizedRelationshipStatus | 'N/A'

export const normalizeRegion = (value?: string | null) =>
    value && value.trim() ? value.trim().toUpperCase().replace(/\s+/g, '_') : 'UNKNOWN'

export const humanizeRegion = (value: string) =>
    value === 'ALL' ? 'All regions' : value.replace(/_/g, ' ')

export const humanizeStatus = (value: string) => (value === 'N/A' ? 'N/A' : humanizeProviderStatus(value))

export function providerStatusBadgeClass(status: NormalizedProviderStatus): string {
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700'
    if (status === 'PENDING_REVIEW') return 'bg-amber-100 text-amber-700'
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-700'
    if (status === 'SUSPENDED') return 'bg-red-100 text-red-700'
    if (status === 'UNKNOWN') return 'bg-slate-200 text-slate-700'
    return 'bg-slate-100 text-slate-700'
}

export function relationshipStatusBadgeClass(status: ProviderRelationshipBadgeStatus): string {
    if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700'
    if (status === 'REQUESTED' || status === 'PROVIDER_ACCEPTED' || status === 'DOCS_PENDING' || status === 'ADMIN_APPROVED') {
        return 'bg-amber-100 text-amber-700'
    }
    if (status === 'SUSPENDED' || status === 'TERMINATED') return 'bg-red-100 text-red-700'
    if (status === 'UNKNOWN') return 'bg-slate-200 text-slate-700'
    return 'bg-slate-100 text-slate-700'
}

export function relationshipComplianceBadgeClass(status?: 'READY' | 'WARN' | 'BLOCKED'): string {
    if (status === 'READY') return 'bg-emerald-100 text-emerald-700'
    if (status === 'WARN') return 'bg-amber-100 text-amber-700'
    if (status === 'BLOCKED') return 'bg-red-100 text-red-700'
    return 'bg-slate-100 text-slate-700'
}

export function listingKindLabel(kind: MarketplaceEntityKind | 'Providers'): string {
    return kind === 'Providers' ? 'Swap Providers' : kind
}
