export type RegionId = 'AFRICA' | 'EUROPE' | 'AMERICAS' | 'ASIA' | 'MIDDLE_EAST'

export type Role =
  | 'SUPER_ADMIN'
  | 'EVZONE_ADMIN'
  | 'EVZONE_OPERATOR'
  | 'SITE_OWNER'
  | 'STATION_OPERATOR'
  | 'STATION_ADMIN'
  | 'MANAGER'
  | 'ATTENDANT'
  | 'CASHIER'
  | 'TECHNICIAN_ORG'
  | 'TECHNICIAN_PUBLIC'
  | 'STATION_OWNER'

export type OwnerCapability = 'CHARGE' | 'SWAP' | 'BOTH'

export type DateRange = 'TODAY' | '7D' | '30D' | 'CUSTOM'

export type Scope = {
  region: RegionId | 'ALL'
  orgId: string | 'ALL'
  stationId: string | 'ALL'
  siteId?: string | 'ALL'
  dateRange: DateRange
}

export type UserProfile = {
  id: string
  name: string
  role: Role
  ownerCapability?: OwnerCapability
  avatarUrl?: string
  orgId?: string
  organizationId?: string
  status?: 'Active' | 'Pending' | 'Suspended' | 'Inactive' | 'Invited'
}

