/**
 * MSW Request Handlers
 * Mock API handlers for demo mode
 */

// @ts-ignore - MSW types may not be available during build
import { http, HttpResponse } from 'msw'
import { mockUsers } from '@/data/mockDb/users'
import { mockChargingSessions, mockSwapSessions } from '@/data/mockDb/sessions'
import type { User as ApiUser, Station, Booking, ChargingSession, WalletBalance, WalletTransaction, Organization, DashboardMetrics, RevenueTrendPoint, UtilizationHour, StationPerformanceRank, Tenant, TenantApplication, LeaseContract, NoticeRequest, Notice, PaymentMethod, CreatePaymentMethodRequest, WithdrawalRequest, WithdrawalTransaction, NotificationItem, ChargePoint, SwapProvider, SwapBay, SwapBayInput, Battery, BatteryInput } from '@/core/api/types'
import type { Role, OwnerCapability } from '@/core/auth/types'
import type { ChargePoint as DomainChargePoint } from '@/core/types/domain'
import { API_CONFIG } from '@/core/api/config'
import { mockDb } from '@/data/mockDb'
import type { Incident, MaintenanceNote } from '@/core/api/types'

const baseURL = API_CONFIG.baseURL

// Mock Incidents Data
let mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    stationId: 'STATION_001',
    stationName: 'Downtown Hub',
    chargerId: 'CP-A1',
    title: 'Connector Fault',
    description: 'CCS2 connector not locking properly.',
    severity: 'HIGH',
    status: 'OPEN',
    errorCode: 'ERR_LOCK_TIMEOUT',
    reportedBy: 'System',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    notes: []
  },
  {
    id: 'INC-002',
    stationId: 'STATION_002',
    stationName: 'Westside Plaza',
    title: 'Offline Station',
    description: 'Station heartbeat missing for 2 hours.',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    errorCode: 'ERR_COMM_LOST',
    reportedBy: 'Watchdog',
    assignedTo: 'u-003',
    assignedName: 'Sam P',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    notes: [
      {
        id: 'NOTE-001',
        incidentId: 'INC-002',
        authorId: 'u-003',
        authorName: 'Sam P',
        content: 'Investigating network latency at the site.',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  }
]

const notificationSeedTime = Date.now()
let mockNotifications: NotificationItem[] = [
  {
    id: 'NTF-001',
    kind: 'alert',
    title: 'Incident INC-2401 opened',
    message: 'Mobile money confirmations delayed',
    source: 'EVZONE Ops',
    read: false,
    createdAt: new Date(notificationSeedTime - 10 * 60 * 1000).toISOString(),
    targetPath: '/incidents',
  },
  {
    id: 'NTF-002',
    kind: 'system',
    title: 'Scheduled maintenance',
    message: 'Analytics pipeline maintenance tonight 2:00 AM',
    source: 'EVZONE Ops',
    read: false,
    createdAt: new Date(notificationSeedTime - 60 * 60 * 1000).toISOString(),
    targetPath: '/reports',
  },
  {
    id: 'NTF-003',
    kind: 'info',
    title: 'New station added',
    message: 'ST-0018 Berlin North has been registered',
    source: 'Platform',
    read: true,
    createdAt: new Date(notificationSeedTime - 3 * 60 * 60 * 1000).toISOString(),
    targetPath: '/sites',
  },
  {
    id: 'NTF-004',
    kind: 'warning',
    title: 'Low battery inventory',
    message: 'Gulu Main Street swap station below threshold',
    source: 'Platform',
    read: true,
    createdAt: new Date(notificationSeedTime - 5 * 60 * 60 * 1000).toISOString(),
    targetPath: '/owner-alerts',
  },
  {
    id: 'NTF-005',
    kind: 'notice',
    title: 'Demand notice sent',
    message: 'To VoltOps Ltd: Payment overdue for November rent. Please settle within 7 days.',
    source: 'Site Owner',
    channels: ['in-app', 'email', 'sms'],
    status: 'sent',
    read: false,
    createdAt: new Date(notificationSeedTime - 2 * 60 * 60 * 1000).toISOString(),
    targetPath: '/tenants/TN-001?tab=actions',
  },
  {
    id: 'NTF-006',
    kind: 'message',
    title: 'Message from tenant',
    message: 'VoltOps Ltd asked to reschedule their maintenance window.',
    source: 'Tenant',
    read: false,
    createdAt: new Date(notificationSeedTime - 7 * 60 * 60 * 1000).toISOString(),
    targetPath: '/tenants/TN-001?tab=overview',
  },
  {
    id: 'NTF-007',
    kind: 'payment',
    title: 'Payment received',
    message: 'GridCity Charging paid $500 via Bank Transfer.',
    source: 'Tenant',
    read: true,
    createdAt: new Date(notificationSeedTime - 26 * 60 * 60 * 1000).toISOString(),
    targetPath: '/tenants/TN-002?tab=financial',
    metadata: { amount: '500', method: 'Bank Transfer' },
  },
  {
    id: 'NTF-008',
    kind: 'application',
    title: 'New tenant application',
    message: 'QuickCharge Co applied for Airport Long-Stay.',
    source: 'Tenant',
    read: false,
    createdAt: new Date(notificationSeedTime - 28 * 60 * 60 * 1000).toISOString(),
    targetPath: '/tenants?tab=applications',
  },
]

// Helper to get auth token from request
function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.substring(7)
}

// Helper to get current user from token (simplified for demo)
function getCurrentUser(): typeof mockUsers[0] | null {
  try {
    const userStr = localStorage.getItem('evzone:user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    // Find matching user from mock data
    const matched = mockUsers.find(u => u.id === user.id || u.email === user.email)
    if (matched) return matched

    return {
      id: user.id || `u-${Date.now()}`,
      name: user.name || 'Demo User',
      email: user.email,
      organizationId: user.organizationId || user.orgId || 'ORG_DEMO',
      role: user.role || 'EVZONE_OPERATOR',
      status: 'Active',
      region: 'AFRICA',
      created: new Date(),
      mfaEnabled: false,
      assignedStations: user.assignedStations,
      ownerCapability: user.ownerCapability,
    } as typeof mockUsers[0]
  } catch {
    return null
  }
}

// Helper to convert domain SwapProvider to API SwapProvider
function mapProviderToAPI(provider: any): SwapProvider {
  return {
    id: provider.id,
    name: provider.name,
    logoUrl: provider.logoUrl,
    region: provider.region,
    standard: provider.standard,
    batteriesSupported: provider.batteriesSupported,
    stationCount: provider.stationCount,
    website: provider.website,
    status: provider.status === 'Active' ? 'Active' : provider.status === 'Pending' ? 'Pending' : 'Inactive',
    partnerSince: provider.partnerSince.toISOString(),
  }
}

// Helper to convert domain Station to API Station
function mapStationToAPI(station: any): Station {
  return {
    id: station.id,
    code: station.id,
    name: station.name,
    address: station.address,
    latitude: station.latitude,
    longitude: station.longitude,
    type: station.type === 'Charging' ? 'CHARGING' : station.type === 'Swap' ? 'SWAP' : 'BOTH',
    status: station.status === 'Online' ? 'ACTIVE' : station.status === 'Offline' ? 'INACTIVE' : 'MAINTENANCE',
    capacity: station.capacity,
    parkingBays: station.parkingBays,
    providerId: station.providerId,
    orgId: station.organizationId,
    createdAt: station.created.toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Mock Bookings
const mockBookings: Booking[] = [
  {
    id: 'BOOK-001',
    userId: 'u-001',
    stationId: 'STATION_001',
    connectorId: 'CP-A1',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'BOOK-002',
    userId: 'u-002',
    stationId: 'STATION_002',
    connectorId: 'CP-B1',
    startTime: new Date(Date.now() + 5400000).toISOString(),
    endTime: new Date(Date.now() + 9000000).toISOString(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
]

// Mock Organizations
const mockOrganizations: Organization[] = [
  {
    id: 'ORG_DEMO',
    name: 'Demo Organization',
    type: 'OPERATOR',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ORG_ALPHA',
    name: 'Alpha Corp',
    type: 'OWNER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Helper to map domain User to API User
function mapUser(domainUser: typeof mockUsers[0]): ApiUser {
  return {
    id: domainUser.id,
    name: domainUser.name,
    email: domainUser.email,
    phone: domainUser.phone,
    role: domainUser.role as any,
    orgId: domainUser.organizationId,
    organizationId: domainUser.organizationId,
    tenantId: undefined,
    assignedStations: domainUser.assignedStations,
    ownerCapability: domainUser.ownerCapability,
    createdAt: domainUser.created.toISOString(),
    updatedAt: domainUser.lastSeen?.toISOString() || domainUser.created.toISOString(),
  }
}

export const handlers = [
  http.get(`${baseURL}/providers`, async () => {
    const providers = mockDb.getProviders().map(mapProviderToAPI)
    return HttpResponse.json(providers)
  }),

  http.get(`${baseURL}/providers/:id`, async ({ params }) => {
    const provider = mockDb.getProvider(params.id as string)
    if (!provider) {
      return HttpResponse.json({ error: 'Provider not found' }, { status: 404 })
    }
    return HttpResponse.json(mapProviderToAPI(provider))
  }),
  // Auth endpoints (handled by authService demo logic, but provide refresh endpoint)
  http.post(`${baseURL}/auth/refresh`, async () => {
    const refreshToken = localStorage.getItem('evzone:refreshToken')
    if (!refreshToken) {
      return HttpResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }
    // Return new tokens (simplified)
    const accessToken = `demo-access-${Date.now()}`
    return HttpResponse.json({
      accessToken,
      refreshToken,
      user: getCurrentUser(),
    })
  }),

  http.post(`${baseURL}/users/invite`, async ({ request }) => {
    const data = await request.json() as {
      email: string
      role: Role
      ownerCapability?: OwnerCapability
      assignedStations?: string[]
      orgId?: string
      organizationId?: string
    }
    const newUser: any = {
      id: `u-${Date.now()}`,
      name: data.email.split('@')[0],
      email: data.email,
      role: data.role,
      organizationId: data.organizationId || data.orgId,
      ownerCapability: data.ownerCapability,
      assignedStations: data.assignedStations,
      status: 'Invited',
      created: new Date(),
      lastSeen: new Date(),
    }
    mockUsers.push(newUser)
    return new HttpResponse(null, { status: 204 })
  }),

  // User endpoints
  http.get(`${baseURL}/users/me`, async ({ request }) => {
    const domainUser = getCurrentUser()
    if (!domainUser) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(mapUser(domainUser))
  }),

  http.get(`${baseURL}/users`, async () => {
    return HttpResponse.json(mockUsers.map(mapUser))
  }),

  http.get(`${baseURL}/users/:id`, async ({ params }) => {
    const domainUser = mockUsers.find(u => u.id === params.id)
    if (!domainUser) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return HttpResponse.json(mapUser(domainUser))
  }),

  http.patch(`${baseURL}/users/me`, async ({ request }) => {
    const domainUser = getCurrentUser()
    if (!domainUser) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json() as Partial<ApiUser>
    const mapped = mapUser(domainUser)
    return HttpResponse.json({ ...mapped, ...body, updatedAt: new Date().toISOString() })
  }),

  http.patch(`${baseURL}/users/:id`, async ({ params, request }) => {
    const domainUser = mockUsers.find(u => u.id === params.id)
    if (!domainUser) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const body = await request.json() as Partial<ApiUser>
    const mapped = mapUser(domainUser)
    return HttpResponse.json({ ...mapped, ...body, updatedAt: new Date().toISOString() })
  }),

  http.delete(`${baseURL}/users/:id`, async ({ params }) => {
    return HttpResponse.json({ success: true })
  }),

  http.get(`${baseURL}/users/:id/vehicles`, async () => {
    return HttpResponse.json([])
  }),

  http.get(`${baseURL}/users/:id/sessions`, async () => {
    return HttpResponse.json(mockChargingSessions)
  }),

  // Station endpoints
  http.get(`${baseURL}/stations`, async ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const orgId = url.searchParams.get('orgId')

    let stations = mockDb.getStations().map(mapStationToAPI)
    if (status) {
      stations = stations.filter(s => s.status === status.toUpperCase())
    }
    if (orgId) {
      stations = stations.filter(s => s.orgId === orgId)
    }

    return HttpResponse.json(stations)
  }),

  http.get(`${baseURL}/stations/:id`, async ({ params }) => {
    const station = mockDb.getStation(params.id as string)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    return HttpResponse.json(mapStationToAPI(station))
  }),

  http.get(`${baseURL}/stations/code/:code`, async ({ params }) => {
    const station = mockDb.getStations().find(s => s.id === params.code)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    return HttpResponse.json(mapStationToAPI(station))
  }),

  http.get(`${baseURL}/stations/nearby`, async ({ request }) => {
    // Return nearby stations (simplified - just return all)
    return HttpResponse.json(mockDb.getStations().map(mapStationToAPI))
  }),

  http.get(`${baseURL}/stations/:id/stats`, async () => {
    return HttpResponse.json({
      totalSessions: 150,
      totalEnergy: 1250.5,
      totalRevenue: 3500.75,
      averageSessionDuration: 45,
    })
  }),

  http.get(`${baseURL}/stations/:id/swaps-today`, async ({ params }) => {
    const station = mockDb.getStation(params.id as string)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayStart.getDate() + 1)

    const count = mockSwapSessions.filter((session) => {
      if (session.stationId !== station.id) return false
      const start = session.start instanceof Date ? session.start : new Date(session.start)
      return start >= todayStart && start < todayEnd
    }).length

    return HttpResponse.json({
      stationId: station.id,
      count,
      date: todayStart.toISOString().split('T')[0],
    })
  }),

  http.post(`${baseURL}/stations`, async ({ request }) => {
    const body = await request.json() as Partial<Station> & { tags?: string[] }
    const user = getCurrentUser()
    const newStation = {
      id: `STATION_${Date.now()}`,
      name: body.name || 'New Station',
      type: (body.type === 'CHARGING' ? 'Charging' : body.type === 'SWAP' ? 'Swap' : 'Both') as any,
      organizationId: (user as any)?.organizationId || (user as any)?.orgId || 'ORG_DEMO',
      address: body.address || '',
      city: '',
      region: 'AFRICA',
      country: '',
      latitude: body.latitude || 0,
      longitude: body.longitude || 0,
      status: 'Online' as any,
      capacity: body.capacity ?? 0,
      parkingBays: (body as any).parkingBays ?? undefined,
      providerId: (body as any).providerId ?? undefined,
      created: new Date(),
      tags: body.tags || [],
    }
    mockDb.addStation(newStation)
    return HttpResponse.json(mapStationToAPI(newStation), { status: 201 })
  }),

  http.patch(`${baseURL}/stations/:id`, async ({ params, request }) => {
    const station = mockDb.getStation(params.id as string)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    const body = await request.json() as Partial<Station>
    const updates: any = {}
    if (body.name) updates.name = body.name
    if (body.address) updates.address = body.address
    if (body.latitude !== undefined) updates.latitude = body.latitude
    if (body.longitude !== undefined) updates.longitude = body.longitude
    if (body.capacity !== undefined) updates.capacity = body.capacity
    if ((body as any).parkingBays !== undefined) updates.parkingBays = (body as any).parkingBays
    if (body.status) {
      updates.status = body.status === 'ACTIVE' ? 'Online' : body.status === 'INACTIVE' ? 'Offline' : 'Maintenance'
    }
    mockDb.updateStation(params.id as string, updates)
    return HttpResponse.json(mapStationToAPI(mockDb.getStation(params.id as string)!))
  }),

  http.delete(`${baseURL}/stations/:id`, async ({ params }) => {
    mockDb.deleteStation(params.id as string)
    return HttpResponse.json({ success: true })
  }),

  http.post(`${baseURL}/stations/:id/health`, async () => {
    return HttpResponse.json({ healthScore: 95 })
  }),

  http.get(`${baseURL}/stations/:id/swap-bays`, async ({ params }) => {
    const station = mockDb.getStation(params.id as string)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    const bays: SwapBay[] = (station.swapLockers || []).map((locker: any) => ({
      id: locker.id,
      stationId: station.id,
      status: locker.status,
      batteryId: locker.batteryPackId,
    }))
    return HttpResponse.json(bays)
  }),

  http.put(`${baseURL}/stations/:id/swap-bays`, async ({ params, request }) => {
    const station = mockDb.getStation(params.id as string)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    const body = await request.json() as { bays?: SwapBayInput[] }
    const inputBays = body?.bays || []
    const validStatuses = new Set(['Available', 'Occupied', 'Charging', 'Faulted', 'Reserved'])

    const swapLockers = inputBays.map((bay, idx) => {
      const status: SwapBay['status'] = validStatuses.has(bay.status || '')
        ? (bay.status as SwapBay['status'])
        : (bay.batteryId ? 'Occupied' : 'Available')

      return {
        id: bay.id,
        stationId: station.id,
        position: idx + 1,
        status,
        batteryPackId: bay.batteryId,
      }
    })

    mockDb.updateStation(params.id as string, { swapLockers })

    const response: SwapBay[] = swapLockers.map((locker: any) => ({
      id: locker.id,
      stationId: station.id,
      status: locker.status,
      batteryId: locker.batteryPackId,
    }))

    return HttpResponse.json(response)
  }),

  http.get(`${baseURL}/stations/:id/batteries`, async ({ params }) => {
    const station = mockDb.getStation(params.id as string)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    return HttpResponse.json(mockDb.getSwapBatteriesByStation(station.id))
  }),

  http.put(`${baseURL}/stations/:id/batteries`, async ({ params, request }) => {
    const station = mockDb.getStation(params.id as string)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    const body = await request.json() as { batteries?: BatteryInput[] }
    const inputBatteries = body?.batteries || []
    const validStatuses = new Set(['Ready', 'Charging', 'Maintenance', 'Faulted'])

    const normalized: Battery[] = inputBatteries.map((battery) => ({
      id: battery.id,
      type: battery.type || 'Unknown',
      soc: battery.soc ?? 0,
      health: battery.health ?? 100,
      status: validStatuses.has(battery.status || '') ? (battery.status as Battery['status']) : 'Ready',
      location: battery.location || battery.bayId || 'Inventory',
      cycles: battery.cycles,
      lastSwapped: battery.lastSwapped,
      stationId: station.id,
      bayId: battery.bayId,
      providerId: battery.providerId,
    }))

    mockDb.setSwapBatteriesForStation(station.id, normalized)
    return HttpResponse.json(normalized)
  }),

  // Session endpoints
  http.get(`${baseURL}/sessions/active`, async () => {
    // Map domain ChargingSession to API ChargingSession
    const active = mockDb.getSessions()
      .filter(s => s.status === 'Active' || !s.end)
      .map(s => ({
        id: s.id,
        userId: s.driverId || 'u-001',
        stationId: s.stationId,
        connectorId: s.connectorId?.toString(),
        startedAt: s.start.toISOString(),
        endedAt: s.end?.toISOString(),
        status: s.status === 'Active' ? 'ACTIVE' as const : s.status === 'Completed' ? 'COMPLETED' as const : 'STOPPED' as const,
        energyDelivered: s.energyKwh,
        cost: s.amount,
      }))
    return HttpResponse.json(active)
  }),

  http.get(`${baseURL}/sessions/:id`, async ({ params }) => {
    const session = mockDb.getSession(params.id as string)
    if (!session) {
      return HttpResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    // Map domain ChargingSession to API ChargingSession
    const apiSession: ChargingSession = {
      id: session.id,
      userId: session.driverId || 'u-001',
      stationId: session.stationId,
      connectorId: session.connectorId?.toString(),
      startedAt: session.start.toISOString(),
      endedAt: session.end?.toISOString(),
      status: session.status === 'Active' ? 'ACTIVE' : session.status === 'Completed' ? 'COMPLETED' : 'STOPPED',
      energyDelivered: session.energyKwh,
      cost: session.amount,
    }
    return HttpResponse.json(apiSession)
  }),

  http.get(`${baseURL}/sessions/stats/summary`, async () => {
    const sessions = mockDb.getSessions()
    return HttpResponse.json({
      total: sessions.length,
      active: sessions.filter(s => s.status === 'Active' || !s.end).length,
      totalEnergy: sessions.reduce((sum, s) => sum + (s.energyKwh || 0), 0),
      totalRevenue: sessions.reduce((sum, s) => sum + (s.amount || 0), 0),
    })
  }),

  http.get(`${baseURL}/sessions/station/:stationId`, async ({ params, request }) => {
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('active') === 'true'
    const sessions = mockDb.getSessions().filter(s => s.stationId === params.stationId)
    const mapSession = (s: typeof mockChargingSessions[0]): ChargingSession => ({
      id: s.id,
      userId: 'u-001',
      stationId: s.stationId,
      connectorId: s.connectorId?.toString(),
      startedAt: s.start.toISOString(),
      endedAt: s.end?.toISOString(),
      status: s.status === 'Active' ? 'ACTIVE' : s.status === 'Completed' ? 'COMPLETED' : 'STOPPED',
      energyDelivered: s.energyKwh,
      cost: s.amount,
    })
    if (activeOnly) {
      const active = sessions.filter(s => s.status === 'Active' || !s.end).map(mapSession)
      return HttpResponse.json({ active })
    }
    return HttpResponse.json({ active: [], recent: sessions.map(mapSession) })
  }),

  http.get(`${baseURL}/sessions/user/:userId`, async ({ params, request }) => {
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('active') === 'true'
    const sessions = mockDb.getSessions().filter(s => s.driverId === params.userId)
    const mapSession = (s: typeof mockChargingSessions[0]): ChargingSession => ({
      id: s.id,
      userId: params.userId as string,
      stationId: s.stationId,
      connectorId: s.connectorId?.toString(),
      startedAt: s.start.toISOString(),
      endedAt: s.end?.toISOString(),
      status: s.status === 'Active' ? 'ACTIVE' : s.status === 'Completed' ? 'COMPLETED' : 'STOPPED',
      energyDelivered: s.energyKwh,
      cost: s.amount,
    })
    if (activeOnly) {
      const active = sessions.filter(s => s.status === 'Active' || !s.end).map(mapSession)
      return HttpResponse.json({ active })
    }
    return HttpResponse.json({ active: [], recent: sessions.map(mapSession) })
  }),

  http.get(`${baseURL}/sessions/history/all`, async ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const stationId = url.searchParams.get('stationId')

    let sessions = [...mockDb.getSessions()]
    if (status) {
      sessions = sessions.filter(s => s.status === status)
    }
    if (stationId) {
      sessions = sessions.filter(s => s.stationId === stationId)
    }

    const start = (page - 1) * limit
    const end = start + limit
    const paginated = sessions.slice(start, end)

    const mapSession = (s: typeof mockChargingSessions[0]): ChargingSession => ({
      id: s.id,
      userId: 'u-001',
      stationId: s.stationId,
      connectorId: s.connectorId?.toString(),
      startedAt: s.start.toISOString(),
      endedAt: s.end?.toISOString(),
      status: s.status === 'Active' ? 'ACTIVE' : s.status === 'Completed' ? 'COMPLETED' : 'STOPPED',
      energyDelivered: s.energyKwh,
      cost: s.amount,
    })

    return HttpResponse.json({
      sessions: paginated.map(mapSession),
      pagination: {
        page,
        limit,
        total: sessions.length,
        totalPages: Math.ceil(sessions.length / limit),
      },
    })
  }),

  http.post(`${baseURL}/sessions/:id/stop`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const session = mockDb.getSession(params.id as string)
    if (!session) {
      return HttpResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const now = new Date()

    mockDb.updateSession(params.id as string, {
      status: 'STOPPED' as any,
      end: now,
    })

    const updated = mockDb.getSession(params.id as string)!
    return HttpResponse.json({
      id: updated.id,
      userId: updated.driverId || 'u-001',
      stationId: updated.stationId,
      connectorId: updated.connectorId?.toString(),
      startedAt: updated.start.toISOString(),
      endedAt: updated.end?.toISOString(),
      status: 'STOPPED' as any,
      energyDelivered: updated.energyKwh,
      cost: updated.amount,
    })
  }),

  // Booking endpoints
  http.get(`${baseURL}/bookings`, async () => {
    return HttpResponse.json(mockBookings)
  }),

  http.get(`${baseURL}/bookings/:id`, async ({ params }) => {
    const booking = mockBookings.find(b => b.id === params.id)
    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    return HttpResponse.json(booking)
  }),

  http.post(`${baseURL}/bookings`, async ({ request }) => {
    const body = await request.json() as Partial<Booking>
    const newBooking: Booking = {
      id: `BOOK-${Date.now()}`,
      userId: body.userId || getCurrentUser()?.id || 'u-001',
      stationId: body.stationId || '',
      connectorId: body.connectorId,
      startTime: body.startTime || new Date().toISOString(),
      endTime: body.endTime || new Date(Date.now() + 3600000).toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    mockBookings.push(newBooking)
    return HttpResponse.json(newBooking, { status: 201 })
  }),

  http.patch(`${baseURL}/bookings/:id`, async ({ params, request }) => {
    const booking = mockBookings.find(b => b.id === params.id)
    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    const body = await request.json() as Partial<Booking>
    Object.assign(booking, body)
    return HttpResponse.json(booking)
  }),

  http.delete(`${baseURL}/bookings/:id`, async ({ params }) => {
    return HttpResponse.json({ success: true })
  }),

  http.get(`${baseURL}/bookings/queue`, async ({ request }) => {
    const url = new URL(request.url)
    const stationId = url.searchParams.get('stationId')
    const queue = mockBookings.filter(b => b.stationId === stationId && b.status === 'PENDING')
    return HttpResponse.json(queue)
  }),

  http.post(`${baseURL}/bookings/:id/checkin`, async ({ params }) => {
    const booking = mockBookings.find(b => b.id === params.id)
    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    booking.status = 'CHECKED_IN'
    return HttpResponse.json(booking)
  }),

  http.patch(`${baseURL}/bookings/:id/status`, async ({ params, request }) => {
    const booking = mockBookings.find(b => b.id === params.id)
    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    const body = await request.json() as { status: Booking['status'] }
    booking.status = body.status
    return HttpResponse.json(booking)
  }),

  http.patch(`${baseURL}/bookings/:id/extend`, async ({ params, request }) => {
    const booking = mockBookings.find(b => b.id === params.id)
    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    const body = await request.json() as { minutes: number }
    const endTime = new Date(booking.endTime)
    endTime.setMinutes(endTime.getMinutes() + body.minutes)
    booking.endTime = endTime.toISOString()
    return HttpResponse.json(booking)
  }),

  http.patch(`${baseURL}/bookings/:id/cancel`, async ({ params }) => {
    const booking = mockBookings.find(b => b.id === params.id)
    if (!booking) {
      return HttpResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    booking.status = 'CANCELLED'
    return HttpResponse.json(booking)
  }),

  http.get(`${baseURL}/bookings/user/:userId`, async ({ params }) => {
    const bookings = mockBookings.filter(b => b.userId === params.userId)
    return HttpResponse.json(bookings)
  }),

  http.get(`${baseURL}/bookings/station/:stationId`, async ({ params }) => {
    const bookings = mockBookings.filter(b => b.stationId === params.stationId)
    return HttpResponse.json(bookings)
  }),

  // Wallet endpoints
  http.get(`${baseURL}/wallet/balance`, async () => {
    return HttpResponse.json<WalletBalance>({
      balance: 1250.50,
      currency: 'USD',
    })
  }),

  http.get(`${baseURL}/wallet/transactions`, async () => {
    const transactions: WalletTransaction[] = [
      {
        id: 'TXN-001',
        type: 'CREDIT',
        amount: 100,
        stationId: 'STATION_001',
        description: 'Top up via card',
        reference: 'REF-001',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'TXN-002',
        type: 'DEBIT',
        amount: -25.50,
        stationId: 'STATION_001',
        description: 'Charging session',
        reference: 'REF-002',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'TXN-003',
        type: 'CREDIT',
        amount: 250.00,
        stationId: 'STATION_002',
        description: 'Monthly payout',
        reference: 'REF-003',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
      },
    ]
    return HttpResponse.json(transactions)
  }),

  http.post(`${baseURL}/wallet/topup`, async ({ request }) => {
    const body = await request.json() as { amount: number; method?: string }
    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}`,
      type: 'CREDIT',
      amount: body.amount,
      description: `Top up via ${body.method || 'card'}`,
      reference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(transaction)
  }),

  http.post(`${baseURL}/wallet/lock`, async () => {
    return HttpResponse.json({ message: 'Wallet locked successfully' })
  }),

  http.post(`${baseURL}/wallet/unlock`, async () => {
    return HttpResponse.json({ message: 'Wallet unlocked successfully' })
  }),

  http.post(`${baseURL}/wallet/transfer`, async ({ request }) => {
    const body = await request.json() as { toUserId: string; amount: number; description: string }
    const transaction: WalletTransaction = {
      id: `TXN-${Date.now()}`,
      type: 'DEBIT',
      amount: -body.amount,
      description: body.description,
      reference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(transaction)
  }),

  // Organization endpoints
  http.get(`${baseURL}/organizations`, async () => {
    return HttpResponse.json(mockOrganizations)
  }),

  http.get(`${baseURL}/organizations/:id`, async ({ params }) => {
    const org = mockOrganizations.find(o => o.id === params.id)
    if (!org) {
      return HttpResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    return HttpResponse.json(org)
  }),

  http.post(`${baseURL}/organizations`, async ({ request }) => {
    const body = await request.json() as Partial<Organization>
    const newOrg: Organization = {
      id: `ORG-${Date.now()}`,
      name: body.name || 'New Organization',
      type: body.type || 'OPERATOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockOrganizations.push(newOrg)
    return HttpResponse.json(newOrg, { status: 201 })
  }),

  // Analytics endpoints
  http.get(`${baseURL}/analytics/dashboard`, async () => {
    const stations = mockDb.getStations()
    const trends: RevenueTrendPoint[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const revenue = Math.floor(Math.random() * 500) + 200
      return {
        date: date.toISOString().split('T')[0],
        revenue,
        cost: Math.floor(revenue * 0.4),
      }
    })

    const utilization: UtilizationHour[] = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        const base = (hour > 8 && hour < 20) ? 60 : 20
        utilization.push({
          day,
          hour,
          utilization: Math.floor(Math.random() * 30) + base
        })
      }
    })

    const topStations: StationPerformanceRank[] = [
      { stationId: 'ST-001', stationName: 'Downtown Hub', revenue: 4500, uptime: 99.8, sessions: 120 },
      { stationId: 'ST-002', stationName: 'Westside Plaza', revenue: 3200, uptime: 97.5, sessions: 85 },
      { stationId: 'ST-003', stationName: 'Airport Road', revenue: 2800, uptime: 94.2, sessions: 150 },
    ]

    const swapTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 50) + 100
      }
    })

    const metrics: DashboardMetrics = {
      realTime: {
        activeSessions: mockChargingSessions.filter(s => s.status === 'Active' || !s.end).length,
        onlineChargers: stations.length,
        totalPower: 156.4,
        currentRevenue: 3500.75,
      },
      today: {
        sessions: mockChargingSessions.length,
        energyDelivered: mockChargingSessions.reduce((sum, s) => sum + (s.energyKwh || 0), 0),
        revenue: mockChargingSessions.reduce((sum, s) => sum + (s.amount || 0), 0),
      },
      chargers: {
        total: stations.length,
        online: stations.filter(s => s.status === 'Online').length,
        offline: stations.filter(s => s.status === 'Offline').length,
        maintenance: stations.filter(s => s.status === 'Maintenance').length,
      },
      trends: {
        revenue: trends,
        utilization,
        topStations,
        swaps: swapTrend,
      },
      swaps: {
        today: 187,
        total: 12450,
        avgTime: '4m 30s',
      },
      inventory: {
        ready: 42,
        charging: 12,
        maintenance: 4,
        total: 58,
      },
      batteryHealth: {
        average: 94.5,
        lowHealthCount: 5,
      }
    }
    return HttpResponse.json(metrics)
  }),

  http.get(`${baseURL}/analytics/uptime`, async ({ request }) => {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '7d'
    return HttpResponse.json({
      period,
      uptime: 99.5,
      downtime: 0.5,
      incidents: 2,
    })
  }),

  http.get(`${baseURL}/analytics/usage`, async ({ request }) => {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '7d'
    return HttpResponse.json({
      period,
      sessions: 150,
      energy: 1250.5,
      averageDuration: 45,
    })
  }),

  http.get(`${baseURL}/analytics/revenue`, async ({ request }) => {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '7d'
    return HttpResponse.json({
      period,
      total: 3500.75,
      breakdown: {
        charging: 3000,
        swap: 500.75,
      },
    })
  }),

  http.get(`${baseURL}/analytics/energy`, async ({ request }) => {
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '7d'
    return HttpResponse.json({
      period,
      total: 1250.5,
      average: 8.3,
      peak: 15.2,
    })
  }),

  http.get(`${baseURL}/analytics/realtime`, async () => {
    return HttpResponse.json({
      activeSessions: 5,
      activeStations: 3,
      currentPower: 120.5,
      queueLength: 2,
    })
  }),

  http.get(`${baseURL}/analytics/operator/dashboard`, async () => {
    const stations = mockDb.getStations()
    return HttpResponse.json({
      stations: stations.length,
      sessions: mockChargingSessions.length,
      revenue: 3500.75,
      energy: 1250.5,
    })
  }),

  http.get(`${baseURL}/analytics/reseller/dashboard`, async () => {
    return HttpResponse.json({
      partners: 5,
      transactions: 120,
      commission: 350.25,
    })
  }),

  http.get(`${baseURL}/analytics/export`, async () => {
    // Return a simple CSV blob for demo
    const csv = 'id,name,value\n1,Test,100\n'
    return new HttpResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="export.csv"',
      },
    })
  }),

  // Charge Point endpoints
  http.get(`${baseURL}/charge-points`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const url = new URL(request.url)
    const stationId = url.searchParams.get('stationId')
    const status = url.searchParams.get('status')

    let chargePoints = mockDb.getChargePoints()
    if (stationId) {
      chargePoints = chargePoints.filter(cp => cp.stationId === stationId)
    }
    if (status) {
      chargePoints = chargePoints.filter(cp => cp.status === status)
    }

    return HttpResponse.json(chargePoints)
  }),

  http.get(`${baseURL}/charge-points/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    const chargePoint = mockDb.getChargePoint(params.id as string)
    if (!chargePoint) {
      return HttpResponse.json({ error: 'Charge point not found' }, { status: 404 })
    }
    return HttpResponse.json(chargePoint)
  }),

  http.post(`${baseURL}/charge-points`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const body = await request.json() as any
    const newChargePoint = {
      id: `CP-${Date.now()}`,
      stationId: body.stationId,
      model: body.model,
      manufacturer: body.manufacturer,
      serialNumber: body.serialNumber,
      firmwareVersion: body.firmwareVersion || '1.0.0',
      status: 'Online' as const,
      connectors: body.connectors.map((c: any, idx: number) => ({
        id: idx + 1,
        type: c.type,
        powerType: c.powerType,
        maxPowerKw: c.maxPowerKw,
        status: 'Available' as const,
      })),
      maxCapacityKw: body.maxCapacityKw || 0,
      parkingBays: body.parkingBays || [],
      ocppStatus: 'Available' as const,
      lastHeartbeat: new Date(),
    }
    mockDb.addChargePoint(newChargePoint)
    return HttpResponse.json(newChargePoint, { status: 201 })
  }),

  http.patch(`${baseURL}/charge-points/:id`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const chargePoint = mockDb.getChargePoint(params.id as string)
    if (!chargePoint) {
      return HttpResponse.json({ error: 'Charge point not found' }, { status: 404 })
    }
    const body = await request.json() as any
    mockDb.updateChargePoint(params.id as string, body)
    const updatedChargePoint = mockDb.getChargePoint(params.id as string)!
    const mapChargePointToAPI = (cp: DomainChargePoint): ChargePoint => ({
      id: cp.id,
      stationId: cp.stationId,
      model: cp.model,
      manufacturer: cp.manufacturer,
      serialNumber: cp.serialNumber,
      firmwareVersion: cp.firmwareVersion,
      ocppId: cp.ocppId,
      status: cp.status as any,
      connectors: cp.connectors as any,
      maxCapacityKw: cp.maxCapacityKw,
      parkingBays: cp.parkingBays,
      ocppStatus: cp.ocppStatus,
      lastHeartbeat: cp.lastHeartbeat?.toISOString(),
    })
    return HttpResponse.json(mapChargePointToAPI(updatedChargePoint))
  }),

  http.delete(`${baseURL}/charge-points/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    mockDb.deleteChargePoint(params.id as string)
    return HttpResponse.json({ success: true })
  }),

  // Incident endpoints
  http.get(`${baseURL}/incidents`, async () => {
    return HttpResponse.json(mockIncidents)
  }),

  http.get(`${baseURL}/incidents/:id`, async ({ params }) => {
    const incident = mockIncidents.find(i => i.id === params.id)
    if (!incident) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(incident)
  }),

  http.post(`${baseURL}/incidents`, async ({ request }) => {
    const body = await request.json() as any
    const newIncident: Incident = {
      id: `INC-${Date.now()}`,
      stationId: body.stationId,
      stationName: 'Station ' + body.stationId, // Simplified
      chargerId: body.assetId,
      title: body.title,
      description: body.description,
      severity: body.severity.toUpperCase(),
      status: 'OPEN',
      reportedBy: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: []
    }
    mockIncidents.push(newIncident)
    return HttpResponse.json(newIncident, { status: 201 })
  }),

  http.post(`${baseURL}/incidents/:id/assign`, async ({ params, request }) => {
    const { technicianId, technicianName } = await request.json() as { technicianId: string; technicianName: string }
    const index = mockIncidents.findIndex(i => i.id === params.id)
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mockIncidents[index] = {
      ...mockIncidents[index],
      assignedTo: technicianId,
      assignedName: technicianName,
      status: 'IN_PROGRESS',
      updatedAt: new Date().toISOString()
    }
    return HttpResponse.json(mockIncidents[index])
  }),

  http.post(`${baseURL}/incidents/:id/notes`, async ({ params, request }) => {
    const { content, authorId, authorName } = await request.json() as { content: string; authorId: string; authorName: string }
    const index = mockIncidents.findIndex(i => i.id === params.id)
    if (index === -1) return new HttpResponse(null, { status: 404 })

    const newNote: MaintenanceNote = {
      id: `NOTE-${Date.now()}`,
      incidentId: params.id as string,
      authorId,
      authorName,
      content,
      createdAt: new Date().toISOString()
    }

    mockIncidents[index].notes.push(newNote)
    mockIncidents[index].updatedAt = new Date().toISOString()
    return HttpResponse.json(newNote)
  }),

  http.patch(`${baseURL}/incidents/:id`, async ({ params, request }) => {
    const body = await request.json() as Partial<Incident>
    const index = mockIncidents.findIndex(i => i.id === params.id)
    if (index === -1) return new HttpResponse(null, { status: 404 })

    mockIncidents[index] = {
      ...mockIncidents[index],
      ...body,
      updatedAt: new Date().toISOString()
    }
    return HttpResponse.json(mockIncidents[index])
  }),

  http.delete(`${baseURL}/incidents/:id`, async ({ params }) => {
    // Note: mockDb doesn't have deleteIncident, but we can filter it out
    return HttpResponse.json({ success: true })
  }),

  // Dispatch endpoints
  http.get(`${baseURL}/dispatches`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const stationId = url.searchParams.get('stationId')

    let dispatches = mockDb.getDispatches()
    if (status) {
      dispatches = dispatches.filter(d => d.status === status)
    }
    if (priority) {
      dispatches = dispatches.filter(d => d.priority === priority)
    }
    if (stationId) {
      dispatches = dispatches.filter(d => d.stationId === stationId)
    }

    return HttpResponse.json(dispatches)
  }),

  http.get(`${baseURL}/dispatches/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    const dispatch = mockDb.getDispatch(params.id as string)
    if (!dispatch) {
      return HttpResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }
    return HttpResponse.json(dispatch)
  }),

  http.post(`${baseURL}/dispatches`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const body = await request.json() as any
    const user = getCurrentUser()
    const station = mockDb.getStation(body.stationId)
    const newDispatch = {
      id: `DSP-${String(mockDb.getDispatches().length + 1).padStart(3, '0')}`,
      title: body.title,
      description: body.description,
      status: 'Pending' as const,
      priority: body.priority,
      stationId: body.stationId,
      stationName: station?.name || 'Unknown Station',
      stationAddress: station?.address || '',
      stationChargers: 0,
      ownerName: 'Owner Name',
      ownerContact: '+256 700 000 000',
      assignee: 'Unassigned',
      assigneeContact: '',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      createdBy: user?.name || 'Admin',
      dueAt: `${body.dueDate} ${body.dueTime}`,
      estimatedDuration: body.estimatedDuration,
      incidentId: body.incidentId,
      requiredSkills: body.requiredSkills || [],
    }
    mockDb.addDispatch(newDispatch)
    return HttpResponse.json(newDispatch, { status: 201 })
  }),

  http.patch(`${baseURL}/dispatches/:id`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const dispatch = mockDb.getDispatch(params.id as string)
    if (!dispatch) {
      return HttpResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }
    const body = await request.json() as any
    mockDb.updateDispatch(params.id as string, body)
    return HttpResponse.json(mockDb.getDispatch(params.id as string))
  }),

  http.post(`${baseURL}/dispatches/:id/assign`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const dispatch = mockDb.getDispatch(params.id as string)
    if (!dispatch) {
      return HttpResponse.json({ error: 'Dispatch not found' }, { status: 404 })
    }
    const body = await request.json() as any
    mockDb.updateDispatch(params.id as string, {
      assignee: body.assignee,
      assigneeContact: body.assigneeContact,
      status: 'Assigned',
    })
    return HttpResponse.json(mockDb.getDispatch(params.id as string))
  }),

  http.delete(`${baseURL}/dispatches/:id`, async ({ params }) => {
    return HttpResponse.json({ success: true })
  }),

  // Tariff endpoints
  http.get(`${baseURL}/tariffs`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const url = new URL(request.url)
    const active = url.searchParams.get('active')

    let tariffs = mockDb.getTariffs()
    if (active !== null) {
      tariffs = tariffs.filter(t => t.active === (active === 'true'))
    }

    return HttpResponse.json(tariffs)
  }),

  http.get(`${baseURL}/tariffs/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    const tariff = mockDb.getTariff(params.id as string)
    if (!tariff) {
      return HttpResponse.json({ error: 'Tariff not found' }, { status: 404 })
    }
    return HttpResponse.json(tariff)
  }),

  http.post(`${baseURL}/tariffs`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const body = await request.json() as any
    const user = getCurrentUser()
    const newTariff = {
      id: `TAR-${String(mockDb.getTariffs().length + 1).padStart(3, '0')}`,
      name: body.name,
      description: body.description,
      type: body.type,
      paymentModel: body.paymentModel || 'Postpaid',
      organizationId: (user as any)?.organizationId || (user as any)?.orgId || 'ORG_DEMO',
      currency: body.currency,
      active: true,
      elements: body.elements,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validTo: body.validTo ? new Date(body.validTo) : undefined,
      applicableStations: body.applicableStations || [],
    }
    mockDb.addTariff(newTariff)
    return HttpResponse.json(newTariff, { status: 201 })
  }),

  http.patch(`${baseURL}/tariffs/:id`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const tariff = mockDb.getTariff(params.id as string)
    if (!tariff) {
      return HttpResponse.json({ error: 'Tariff not found' }, { status: 404 })
    }
    const body = await request.json() as any
    if (body.validFrom) body.validFrom = new Date(body.validFrom)
    if (body.validTo) body.validTo = new Date(body.validTo)
    mockDb.updateTariff(params.id as string, body)
    return HttpResponse.json(mockDb.getTariff(params.id as string))
  }),

  http.delete(`${baseURL}/tariffs/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    mockDb.deleteTariff(params.id as string)
    return HttpResponse.json({ success: true })
  }),

  // Webhook endpoints
  http.get(`${baseURL}/webhooks`, async () => {
    const { mockDb } = await import('@/data/mockDb')
    return HttpResponse.json(mockDb.getWebhooks())
  }),

  http.get(`${baseURL}/webhooks/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    const webhook = mockDb.getWebhook(params.id as string)
    if (!webhook) {
      return HttpResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }
    return HttpResponse.json(webhook)
  }),

  http.post(`${baseURL}/webhooks`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const body = await request.json() as any
    const user = getCurrentUser()
    const newWebhook = {
      id: `WH-${String(mockDb.getWebhooks().length + 1).padStart(3, '0')}`,
      organizationId: (user as any)?.organizationId || (user as any)?.orgId || 'ORG_DEMO',
      name: body.name,
      url: body.url,
      events: body.events,
      secret: body.secret || `secret-${Date.now()}`,
      status: 'Active' as const,
      retryCount: 3,
    }
    mockDb.addWebhook(newWebhook)
    return HttpResponse.json(newWebhook, { status: 201 })
  }),

  http.patch(`${baseURL}/webhooks/:id`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const webhook = mockDb.getWebhook(params.id as string)
    if (!webhook) {
      return HttpResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }
    const body = await request.json() as any
    mockDb.updateWebhook(params.id as string, body)
    return HttpResponse.json(mockDb.getWebhook(params.id as string))
  }),

  http.delete(`${baseURL}/webhooks/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    mockDb.deleteWebhook(params.id as string)
    return HttpResponse.json({ success: true })
  }),

  http.post(`${baseURL}/auth/refresh`, async ({ request }) => {
    // In a real application, you would validate the refresh token and issue a new access token.
    // For this mock, we'll just return a dummy new token.
    const body = await request.json() as { refreshToken: string }
    if (!body.refreshToken) {
      return HttpResponse.json({ error: 'Refresh token is required' }, { status: 400 })
    }
    return HttpResponse.json({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' })
  }),

  // Invite User
  http.post(`${baseURL}/users/invite`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const body = await request.json() as {
      email: string
      role: string
      ownerCapability?: OwnerCapability
      assignedStations?: string[]
      orgId?: string
      organizationId?: string
    }
    const newUser = {
      id: `u-${Date.now()}`,
      name: body.email.split('@')[0],
      email: body.email,
      role: body.role,
      organizationId: body.organizationId || body.orgId,
      ownerCapability: body.ownerCapability,
      assignedStations: body.assignedStations,
      status: 'Pending',
      created: new Date(),
      lastSeen: new Date(),
    }
    mockDb.addUser(newUser as any)
    return HttpResponse.json({ success: true }, { status: 201 })
  }),

  http.post(`${baseURL}/webhooks/:id/test`, async ({ params }) => {
    // Mock webhook test
    return HttpResponse.json({ success: true, statusCode: 200 })
  }),

  // Billing endpoints
  http.get(`${baseURL}/billing/invoices`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const url = new URL(request.url)
    const typeFilter = url.searchParams.get('type')
    const statusFilter = url.searchParams.get('status')

    let invoices = mockDb.getInvoices()
    if (typeFilter) invoices = invoices.filter(i => i.type === typeFilter)
    if (statusFilter) invoices = invoices.filter(i => i.status === statusFilter)

    return HttpResponse.json(invoices)
  }),

  http.get(`${baseURL}/billing/invoices/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    const invoice = mockDb.getInvoice(params.id as string)
    if (!invoice) {
      return HttpResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return HttpResponse.json(invoice)
  }),

  http.post(`${baseURL}/billing/invoices/generate`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const body = await request.json() as any
    const user = getCurrentUser()

    const newInvoice = {
      id: `INV-${Date.now()}`,
      type: body.type || 'Usage',
      org: body.organizationId || (user as any)?.organizationId || 'Unknown Org',
      amount: Math.random() * 5000 + 500,
      currency: 'USD',
      status: 'Pending' as const,
      issuedAt: new Date().toISOString().split('T')[0],
      dueAt: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      description: body.description || `Generated ${body.type} invoice for period`,
      lineItems: [
        {
          description: 'Platform Usage Fee',
          quantity: 1,
          unitPrice: 500,
          total: 500
        }
      ]
    }

    mockDb.addInvoice(newInvoice)
    return HttpResponse.json(newInvoice, { status: 201 })
  }),


  // Site Owner - Sites endpoints
  http.get(`${baseURL}/sites`, async () => {
    const stations = mockDb.getStations()
    const sites = stations.map(s => ({
      id: s.id,
      name: s.name,
      address: s.address,
      region: 'AFRICA',
      status: s.status === 'Online' ? 'Listed' : s.status === 'Offline' ? 'Draft' : 'Leased',
      slots: 5,
      payout: Math.floor(Math.random() * 5000),
    }))
    return HttpResponse.json(sites)
  }),

  // Applications endpoints
  http.get(`${baseURL}/applications`, async ({ request }: { request: any }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const { mockDb } = await import('@/data/mockDb')

    // Initialize if empty
    if (mockDb.getApplications().length === 0) {
      const initialApplications: TenantApplication[] = [
        {
          id: 'APP-001',
          applicantId: 'u-005',
          applicantName: 'John Doe',
          organizationName: 'QuickCharge Co',
          businessRegistrationNumber: 'BRN-2023-001',
          taxComplianceNumber: 'TAX-QC-2023',
          contactPersonName: 'John Doe',
          contactEmail: 'john@quickcharge.com',
          contactPhone: '+256-700-123456',
          physicalAddress: '123 Business Park, Kampala',
          companyWebsite: 'https://quickcharge.com',
          yearsInEVBusiness: '3-5',
          existingStationsOperated: 12,
          siteId: 'STATION_002',
          siteName: 'Airport East',
          preferredLeaseModel: 'Fixed Rent',
          businessPlanSummary: 'Interested in leasing this site for our charging network expansion. We plan to install 10 fast chargers to serve airport traffic.',
          sustainabilityCommitments: 'We commit to using 100% renewable energy and recycling all equipment at end-of-life.',
          additionalServices: ['EV Maintenance', 'Retail'],
          estimatedStartDate: new Date(Date.now() + 2592000000).toISOString(),
          status: 'Pending',
          message: 'Interested in leasing this site for our charging network expansion.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          documents: []
        },
      ]
      mockDb.setApplications(initialApplications)
    }

    return HttpResponse.json(mockDb.getApplications().filter(a => !status || a.status === status))
  }),

  http.patch(`${baseURL}/applications/:id/status`, async ({ params, request }: { params: any; request: any }) => {
    const body = await request.json() as { status: string; message?: string }
    const { mockDb } = await import('@/data/mockDb')

    mockDb.updateApplicationStatus(params.id as string, body.status, body.message)
    const updated = mockDb.getApplications().find(a => a.id === params.id)

    if (body.status === 'Approved' && updated) {
      // Create a tenant if approved
      const tenants = mockDb.getTenants()
      const newTenant: Tenant = {
        id: `TN-${Date.now()}`,
        name: updated.applicantName,
        type: 'Operator',
        siteId: updated.siteId,
        siteName: updated.siteName,
        model: 'Fixed Rent',
        terms: `$${updated.proposedRent || 0}/mo`,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        earnings: 0,
        outstandingDebt: 0,
        totalPaid: 0,
        overduePayments: [],
        nextPaymentDue: { date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], amount: updated.proposedRent || 0 },
        paymentHistory: [],
        email: 'tenant@example.com',
      }
      mockDb.setTenants([...tenants, newTenant])

      // Also create a contract
      const contracts = mockDb.getContracts()
      const newContract: LeaseContract = {
        id: `LEASE-${Date.now()}`,
        siteId: updated.siteId,
        tenantId: newTenant.id,
        tenantName: newTenant.name,
        organizationId: updated.organizationId || 'org-new',
        status: 'Active',
        startDate: newTenant.startDate,
        endDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        rent: updated.proposedRent || 0,
        currency: 'USD',
        paymentSchedule: 'Monthly',
        autoRenew: true,
        model: 'Fixed Rent',
        terms: newTenant.terms,
        stationIds: [updated.siteId],
      }
      mockDb.setContracts([...contracts, newContract])
    }

    return HttpResponse.json(updated)
  }),

  // Tenant endpoints
  http.get(`${baseURL}/tenants`, async ({ request }: { request: any }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    const { mockDb } = await import('@/data/mockDb')

    // Initialize if empty
    if (mockDb.getTenants().length === 0) {
      const initialTenants: Tenant[] = [
        {
          id: 'TN-001',
          name: 'VoltOps Ltd',
          type: 'Operator',
          siteId: 'ST-0001',
          siteName: 'City Mall Roof',
          model: 'Revenue Share',
          terms: '15%',
          startDate: '2024-06-01',
          status: 'Active',
          earnings: 4520,
          outstandingDebt: 0,
          totalPaid: 4520,
          overduePayments: [],
          nextPaymentDue: { date: '2024-12-01', amount: 750 },
          paymentHistory: [
            { id: 'PH-001', amount: 750, date: '2024-11-01', method: 'Bank Transfer', reference: 'REF-001', status: 'completed' },
            { id: 'PH-002', amount: 750, date: '2024-10-01', method: 'Bank Transfer', reference: 'REF-002', status: 'completed' },
          ],
          email: 'contact@voltops.com',
          phone: '+1000000001',
        },
        {
          id: 'TN-002',
          name: 'GridCity Charging',
          type: 'Owner',
          siteId: 'ST-0001',
          siteName: 'City Mall Roof',
          model: 'Fixed Rent',
          terms: '$500/mo',
          startDate: '2024-08-15',
          status: 'Active',
          earnings: 1500,
          outstandingDebt: 500,
          totalPaid: 1000,
          overduePayments: [
            { id: 'OD-001', amount: 500, dueDate: '2024-11-15', daysOverdue: 15, description: 'November rent' },
          ],
          nextPaymentDue: { date: '2024-12-15', amount: 500 },
          paymentHistory: [
            { id: 'PH-003', amount: 500, date: '2024-10-15', method: 'Bank Transfer', reference: 'REF-003', status: 'completed' },
          ],
          email: 'info@gridcity.com',
        },
      ]
      mockDb.setTenants(initialTenants)
    }

    return HttpResponse.json(mockDb.getTenants().filter(t => !status || t.status === status))
  }),

  http.get(`${baseURL}/tenants/:id`, async ({ params }) => {
    const tenantTarget = mockDb.getTenant(params.id as string)
    if (!tenantTarget) {
      return HttpResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    return HttpResponse.json(tenantTarget)
  }),

  http.get(`${baseURL}/tenants/:id/contract`, async ({ params }) => {
    // Initialize if empty
    if (mockDb.getContract(params.id as string) === undefined) {
      const initialContracts: LeaseContract[] = [
        {
          id: 'LEASE-001',
          siteId: 'ST-0001',
          tenantId: 'TN-001',
          tenantName: 'VoltOps Ltd',
          organizationId: 'org-001',
          status: 'Active',
          startDate: '2024-06-01',
          endDate: '2025-06-01',
          rent: 750,
          currency: 'USD',
          paymentSchedule: 'Monthly',
          autoRenew: true,
          model: 'Revenue Share',
          terms: '15% of revenue',
          stationIds: ['ST-0001'],
        },
        {
          id: 'LEASE-002',
          siteId: 'ST-0001',
          tenantId: 'TN-002',
          tenantName: 'GridCity Charging',
          organizationId: 'org-002',
          status: 'Active',
          startDate: '2024-08-15',
          endDate: '2025-08-15',
          rent: 500,
          currency: 'USD',
          paymentSchedule: 'Monthly',
          autoRenew: true,
          model: 'Fixed Rent',
          terms: '$500/mo flat fee',
          stationIds: ['ST-0001'],
        },
      ]
      mockDb.setContracts(initialContracts)
    }

    const contractResult = mockDb.getContract(params.id as string)
    if (!contractResult) {
      return HttpResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    return HttpResponse.json(contractResult)
  }),

  // Notice endpoints
  http.post(`${baseURL}/notices`, async ({ request }: { request: any }) => {
    const body = await request.json() as NoticeRequest
    const notice: Notice = {
      id: `NOTICE-${Date.now()}`,
      tenantId: body.tenantId,
      tenantName: 'VoltOps Ltd',
      type: body.type,
      message: body.message,
      channels: body.channels,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    const newNotification: NotificationItem = {
      id: `NTF-${Date.now()}`,
      kind: 'notice',
      title: 'Notice sent',
      message: `To ${notice.tenantName}: ${notice.message}`,
      source: 'Site Owner',
      read: false,
      createdAt: notice.sentAt || notice.createdAt,
      channels: notice.channels,
      status: notice.status,
      targetPath: `/tenants/${notice.tenantId}?tab=actions`,
    }
    mockNotifications = [newNotification, ...mockNotifications]
    return HttpResponse.json(notice, { status: 201 })
  }),

  http.get(`${baseURL}/notices`, async ({ request }: { request: any }) => {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenantId')

    const notices: Notice[] = [
      {
        id: 'NOTICE-001',
        tenantId: 'TN-001',
        tenantName: 'VoltOps Ltd',
        type: 'payment_reminder',
        message: 'Reminder: Payment due on December 1st',
        channels: ['in-app', 'email'],
        status: 'sent',
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]

    const filtered = tenantId ? notices.filter(n => n.tenantId === tenantId) : notices
    return HttpResponse.json(filtered)
  }),

  // Notifications endpoints
  http.get(`${baseURL}/notifications`, async () => {
    return HttpResponse.json(mockNotifications)
  }),

  // Payment Method endpoints
  http.get(`${baseURL}/payment-methods`, async () => {
    const methods: PaymentMethod[] = [
      {
        id: 'PM-001',
        type: 'bank',
        label: 'Main Bank Account',
        accountNumber: '****1234',
        bankName: 'First National Bank',
        routingNumber: '123456789',
        accountHolderName: 'John Doe',
        isVerified: true,
        isDefault: true,
        createdAt: new Date(Date.now() - 2592000000).toISOString(),
      },
      {
        id: 'PM-002',
        type: 'mobile',
        label: 'Mobile Money',
        phoneNumber: '+256700000000',
        provider: 'MTN',
        isVerified: true,
        isDefault: false,
        createdAt: new Date(Date.now() - 1728000000).toISOString(),
      },
    ]
    return HttpResponse.json(methods)
  }),

  http.post(`${baseURL}/payment-methods`, async ({ request }: { request: any }) => {
    const body = await request.json() as CreatePaymentMethodRequest
    const method: PaymentMethod = {
      id: `PM-${Date.now()}`,
      type: body.type,
      label: body.label,
      phoneNumber: body.phoneNumber,
      provider: body.provider,
      walletType: body.walletType,
      walletAddress: body.walletAddress,
      cardLast4: body.cardNumber ? body.cardNumber.slice(-4) : undefined,
      cardBrand: body.cardNumber ? 'Visa' : undefined,
      cardExpiry: body.cardExpiry,
      cardHolderName: body.cardHolderName,
      accountNumber: body.accountNumber ? `****${body.accountNumber.slice(-4)}` : undefined,
      bankName: body.bankName,
      routingNumber: body.routingNumber,
      accountHolderName: body.accountHolderName,
      isVerified: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(method, { status: 201 })
  }),

  http.patch(`${baseURL}/payment-methods/:id`, async ({ params, request }: { params: any; request: any }) => {
    const body = await request.json() as Partial<CreatePaymentMethodRequest>
    const method: PaymentMethod = {
      id: params.id,
      type: body.type || 'bank',
      label: body.label || 'Updated Method',
      isVerified: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(method)
  }),

  http.delete(`${baseURL}/payment-methods/:id`, async () => {
    return HttpResponse.json({ message: 'Payment method deleted' })
  }),

  http.post(`${baseURL}/payment-methods/:id/set-default`, async ({ params }: { params: any }) => {
    const method: PaymentMethod = {
      id: params.id,
      type: 'bank',
      label: 'Default Method',
      isVerified: true,
      isDefault: true,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(method)
  }),

  // Withdrawal endpoints
  http.post(`${baseURL}/withdrawals`, async ({ request }: { request: any }) => {
    const body = await request.json() as WithdrawalRequest
    const fee = body.amount * 0.02 // 2% fee
    const transaction: WithdrawalTransaction = {
      id: `WD-${Date.now()}`,
      amount: body.amount,
      fee: fee,
      netAmount: body.amount - fee,
      method: body.method,
      paymentMethodId: body.paymentMethodId,
      paymentMethodLabel: 'Main Bank Account',
      currency: body.currency,
      status: 'pending',
      reference: `REF-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(transaction, { status: 201 })
  }),

  http.get(`${baseURL}/withdrawals`, async () => {
    const transactions: WithdrawalTransaction[] = [
      {
        id: 'WD-001',
        amount: 1000,
        fee: 20,
        netAmount: 980,
        method: 'bank',
        paymentMethodId: 'PM-001',
        paymentMethodLabel: 'Main Bank Account',
        currency: 'USD',
        status: 'completed',
        reference: 'REF-001',
        createdAt: new Date(Date.now() - 1728000000).toISOString(),
        completedAt: new Date(Date.now() - 1728000000 + 3600000).toISOString(),
      },
      {
        id: 'WD-002',
        amount: 500,
        fee: 10,
        netAmount: 490,
        method: 'mobile',
        paymentMethodId: 'PM-002',
        paymentMethodLabel: 'Mobile Money',
        currency: 'USD',
        status: 'processing',
        reference: 'REF-002',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ]
    return HttpResponse.json(transactions)
  }),

  // ============================================================================
  // Application Submission Endpoints
  // ============================================================================

  // Submit new application
  http.post(`${baseURL}/applications`, async ({ request }) => {
    const body = await request.json() as any
    const newApp = mockDb.createApplication(body)
    return HttpResponse.json(newApp, { status: 201 })
  }),

  // Upload document to application
  http.post(`${baseURL}/applications/:id/documents`, async ({ params, request }) => {
    const { id } = params
    const formData = await request.formData()

    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const documentType = formData.get('documentType') as string
    const required = formData.get('required') === 'true'

    const doc = mockDb.uploadDocument(id as string, {
      category,
      documentType,
      fileName: file?.name || 'document.pdf',
      fileSize: file?.size || 0,
      fileUrl: `/uploads/${file?.name || 'document.pdf'}`,
      required
    })

    return HttpResponse.json(doc, { status: 201 })
  }),

  // Update commercial terms (site owner only)
  http.patch(`${baseURL}/applications/:id/terms`, async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any

    const updated = mockDb.updateApplicationTerms(id as string, body)
    if (!updated) {
      return HttpResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return HttpResponse.json(updated)
  }),

  // Reboot charge point
  http.post(`${baseURL}/charge-points/:id/reboot`, async ({ params }) => {
    return HttpResponse.json({ success: true, message: 'Reboot command accepted' })
  }),
]
