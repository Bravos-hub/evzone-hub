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
} as const

