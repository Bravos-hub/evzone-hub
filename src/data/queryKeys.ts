/**
 * Query Keys
 * Centralized query keys for React Query
 */

export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: (filters?: Record<string, unknown>) => ['users', filters] as const,
    detail: (id: string) => ['users', id] as const,
    vehicles: (id: string) => ['users', id, 'vehicles'] as const,
    sessions: (id: string) => ['users', id, 'sessions'] as const,
  },

  // Stations
  stations: {
    all: (filters?: Record<string, unknown>) => ['stations', filters] as const,
    detail: (id: string) => ['stations', id] as const,
    byCode: (code: string) => ['stations', 'code', code] as const,
    nearby: (lat: number, lng: number, radius?: number) => ['stations', 'nearby', lat, lng, radius] as const,
    stats: (id: string) => ['stations', id, 'stats'] as const,
    swapsToday: (id: string) => ['stations', id, 'swaps-today'] as const,
    swapBays: (id: string) => ['stations', id, 'swap-bays'] as const,
    batteries: (id: string) => ['stations', id, 'batteries'] as const,
  },

  // Bookings
  bookings: {
    all: ['bookings'] as const,
    detail: (id: string) => ['bookings', id] as const,
    queue: (stationId: string) => ['bookings', 'queue', stationId] as const,
    byUser: (userId: string) => ['bookings', 'user', userId] as const,
    byStation: (stationId: string) => ['bookings', 'station', stationId] as const,
  },

  // Sessions
  sessions: {
    active: ['sessions', 'active'] as const,
    detail: (id: string) => ['sessions', id] as const,
    stats: ['sessions', 'stats'] as const,
    byStation: (stationId: string, activeOnly?: boolean) => ['sessions', 'station', stationId, activeOnly] as const,
    byUser: (userId: string, activeOnly?: boolean) => ['sessions', 'user', userId, activeOnly] as const,
    history: (filters?: Record<string, unknown>) => ['sessions', 'history', filters] as const,
  },

  // Wallet
  wallet: {
    balance: ['wallet', 'balance'] as const,
    transactions: ['wallet', 'transactions'] as const,
  },

  // Analytics
  analytics: {
    dashboard: ['analytics', 'dashboard'] as const,
    uptime: (period: string) => ['analytics', 'uptime', period] as const,
    usage: (period: string) => ['analytics', 'usage', period] as const,
    revenue: (period: string) => ['analytics', 'revenue', period] as const,
    energy: (period: string) => ['analytics', 'energy', period] as const,
    realtime: ['analytics', 'realtime'] as const,
    operatorDashboard: (startDate?: string, endDate?: string) => ['analytics', 'operator', 'dashboard', startDate, endDate] as const,
    resellerDashboard: (startDate?: string, endDate?: string) => ['analytics', 'reseller', 'dashboard', startDate, endDate] as const,
  },

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    detail: (id: string) => ['organizations', id] as const,
  },

  // Sites
  sites: {
    all: (filters?: Record<string, unknown>) => ['sites', filters] as const,
    detail: (id: string) => ['sites', id] as const,
    documents: (id: string) => ['sites', id, 'documents'] as const,
    stats: (id: string) => ['sites', id, 'stats'] as const,
  },

  // Swap Providers
  providers: {
    all: (filters?: Record<string, unknown>) => ['providers', filters] as const,
    marketplaceAll: (filters?: Record<string, unknown>) => ['providers', 'marketplace', filters] as const,
    detail: (id: string) => ['providers', id] as const,
    marketplaceDetail: (id: string) => ['providers', 'marketplace', id] as const,
    documents: (filters?: Record<string, unknown>) => ['providers', 'documents', filters] as const,
    requirements: (filters?: Record<string, unknown>) => ['providers', 'requirements', filters] as const,
    compliance: (providerId: string) => ['providers', providerId, 'compliance'] as const,
    complianceStatuses: (providerIds: string[]) => ['providers', 'compliance-statuses', ...providerIds] as const,
    relationships: (filters?: Record<string, unknown>) => ['providers', 'relationships', filters] as const,
    relationshipCompliance: (relationshipId: string) => ['providers', 'relationships', relationshipId, 'compliance'] as const,
    relationshipComplianceStatuses: (relationshipIds: string[]) =>
      ['providers', 'relationships', 'compliance-statuses', ...relationshipIds] as const,
    compliancePolicy: ['providers', 'compliance-policy'] as const,
    settlements: (filters?: Record<string, unknown>) => ['providers', 'settlements', filters] as const,
    eligible: (ownerOrgId?: string) => ['providers', 'eligible', ownerOrgId ?? 'none'] as const,
  },

  // Tariffs
  tariffs: {
    all: (filters?: Record<string, unknown>) => ['tariffs', filters] as const,
    detail: (id: string) => ['tariffs', id] as const,
  },

  // Marketplace
  marketplace: {
    detail: (kind?: string, id?: string) => ['marketplace', 'details', kind ?? 'none', id ?? 'none'] as const,
    recentContacts: (limit?: number) => ['marketplace', 'recent-contacts', limit ?? 12] as const,
  },
} as const

