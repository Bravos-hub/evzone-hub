import type { Site } from '@/core/api/types'
import type { Application } from '@/modules/applications/types'

export type AccessibleSiteSource = 'OWNED' | 'RENTED'

export type AccessibleSiteOption = {
  id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  source: AccessibleSiteSource
  ownerId?: string
  organizationId?: string | null
  applicationId?: string
  leaseStatus?: string
}

const ACTIVE_RENTAL_STATUSES = new Set(['LEASE_SIGNED', 'COMPLETED'])

function normalizeStatus(status?: string): string {
  return (status || '').trim().toUpperCase()
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) return undefined
  return value
}

function toSiteOption(
  site: Site,
  source: AccessibleSiteSource,
  extras?: Pick<AccessibleSiteOption, 'applicationId' | 'leaseStatus'>
): AccessibleSiteOption {
  return {
    id: site.id,
    name: site.name || 'Unnamed Site',
    address: site.address || '',
    latitude: toNumberOrUndefined(site.latitude),
    longitude: toNumberOrUndefined(site.longitude),
    source,
    ownerId: site.ownerId,
    organizationId: site.organizationId,
    applicationId: extras?.applicationId,
    leaseStatus: extras?.leaseStatus,
  }
}

function isOwnedByViewer(site: Site, viewerId?: string, viewerOrgId?: string): boolean {
  if (viewerId && site.ownerId === viewerId) return true
  if (viewerOrgId && site.organizationId && site.organizationId === viewerOrgId) return true
  return false
}

function isRentedByViewer(
  application: Application,
  viewerId?: string,
  viewerOrgId?: string
): boolean {
  const linkedByUser = Boolean(viewerId && (application.operatorId === viewerId || application.tenantId === viewerId))
  const appOrgId = (application as any).organizationId || (application as any).orgId || application.site?.organizationId
  const linkedByOrg = Boolean(viewerOrgId && appOrgId && appOrgId === viewerOrgId)
  return linkedByUser || linkedByOrg
}

export function buildAccessibleSites(args: {
  sites?: Site[]
  applications?: Application[]
  viewerId?: string
  viewerOrgId?: string
  scopeToOwner?: boolean
}): AccessibleSiteOption[] {
  const {
    sites = [],
    applications = [],
    viewerId,
    viewerOrgId,
    scopeToOwner = true,
  } = args

  const byId = new Map<string, AccessibleSiteOption>()
  const siteById = new Map<string, Site>(sites.map((site) => [site.id, site]))

  for (const site of sites) {
    if (scopeToOwner && !isOwnedByViewer(site, viewerId, viewerOrgId)) continue
    byId.set(site.id, toSiteOption(site, 'OWNED'))
  }

  for (const app of applications) {
    const leaseStatus = normalizeStatus(app.status)
    if (!ACTIVE_RENTAL_STATUSES.has(leaseStatus)) continue
    if (scopeToOwner && !isRentedByViewer(app, viewerId, viewerOrgId)) continue

    const siteCandidate = app.site || siteById.get(app.siteId)
    if (!siteCandidate) continue

    const existing = byId.get(siteCandidate.id)
    if (existing?.source === 'OWNED') continue

    byId.set(
      siteCandidate.id,
      toSiteOption(siteCandidate, 'RENTED', {
        applicationId: app.id,
        leaseStatus,
      })
    )
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}
