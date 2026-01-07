/**
 * MSW Request Handlers
 * Mock API handlers for demo mode
 */

import { http, HttpResponse } from 'msw'
import { mockUsers } from '@/data/mockDb/users'
import { mockChargingSessions } from '@/data/mockDb/sessions'
import type { User, Station, Booking, ChargingSession, WalletBalance, WalletTransaction, Organization, DashboardMetrics } from '@/core/api/types'
import { API_CONFIG } from '@/core/api/config'
import { mockDb } from '@/data/mockDb'

const baseURL = API_CONFIG.baseURL

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
    return mockUsers.find(u => u.id === user.id || u.email === user.email) || null
  } catch {
    return null
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

export const handlers = [
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

  // Helper to map domain User to API User
  const mapUser = (domainUser: typeof mockUsers[0]): User => ({
    id: domainUser.id,
    name: domainUser.name,
    email: domainUser.email,
    phone: domainUser.phone,
    role: domainUser.role,
    orgId: domainUser.organizationId,
    tenantId: undefined,
    createdAt: domainUser.created.toISOString(),
    updatedAt: domainUser.lastSeen?.toISOString() || domainUser.created.toISOString(),
  })

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
    const body = await request.json() as Partial<User>
    const mapped = mapUser(domainUser)
    return HttpResponse.json({ ...mapped, ...body, updatedAt: new Date().toISOString() })
  }),

  http.patch(`${baseURL}/users/:id`, async ({ params, request }) => {
    const domainUser = mockUsers.find(u => u.id === params.id)
    if (!domainUser) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const body = await request.json() as Partial<User>
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

  http.post(`${baseURL}/stations`, async ({ request }) => {
    const body = await request.json() as Partial<Station> & { tags?: string[] }
    const user = getCurrentUser()
    const newStation = {
      id: `STATION_${Date.now()}`,
      name: body.name || 'New Station',
      type: (body.type === 'CHARGING' ? 'Charging' : body.type === 'SWAP' ? 'Swap' : 'Both') as any,
      organizationId: user?.orgId || 'ORG_DEMO',
      address: body.address || '',
      city: '',
      region: 'AFRICA',
      country: '',
      latitude: body.latitude || 0,
      longitude: body.longitude || 0,
      status: 'Online' as any,
      capacity: 0,
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
        description: 'Top up via card',
        reference: 'REF-001',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'TXN-002',
        type: 'DEBIT',
        amount: -25.50,
        description: 'Charging session',
        reference: 'REF-002',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
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
    const metrics: DashboardMetrics = {
      realTime: {
        activeSessions: mockChargingSessions.filter(s => s.status === 'Active' || !s.end).length,
        onlineChargers: mockStations.length,
        totalPower: 120.5,
        currentRevenue: 3500.75,
      },
      today: {
        sessions: mockChargingSessions.length,
        energyDelivered: mockChargingSessions.reduce((sum, s) => sum + (s.energyKwh || 0), 0),
        revenue: mockChargingSessions.reduce((sum, s) => sum + (s.amount || 0), 0),
      },
      chargers: {
        total: mockStations.length,
        online: mockStations.filter(s => s.status === 'ACTIVE').length,
        offline: 0,
        maintenance: mockStations.filter(s => s.status === 'MAINTENANCE').length,
      },
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
    return HttpResponse.json({
      stations: mockStations.length,
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
    return HttpResponse.json(mockDb.getChargePoint(params.id as string))
  }),

  http.delete(`${baseURL}/charge-points/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    mockDb.deleteChargePoint(params.id as string)
    return HttpResponse.json({ success: true })
  }),

  // Incident endpoints
  http.get(`${baseURL}/incidents`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const severity = url.searchParams.get('severity')
    const stationId = url.searchParams.get('stationId')
    
    let incidents = mockDb.getIncidents()
    if (status) {
      incidents = incidents.filter(i => i.status === status)
    }
    if (severity) {
      incidents = incidents.filter(i => i.severity === severity)
    }
    if (stationId) {
      incidents = incidents.filter(i => i.stationId === stationId)
    }
    
    return HttpResponse.json(incidents)
  }),

  http.get(`${baseURL}/incidents/:id`, async ({ params }) => {
    const { mockDb } = await import('@/data/mockDb')
    const incident = mockDb.getIncident(params.id as string)
    if (!incident) {
      return HttpResponse.json({ error: 'Incident not found' }, { status: 404 })
    }
    return HttpResponse.json(incident)
  }),

  http.post(`${baseURL}/incidents`, async ({ request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const body = await request.json() as any
    const user = getCurrentUser()
    const newIncident = {
      id: `INC-${Date.now()}`,
      stationId: body.stationId,
      assetId: body.assetId,
      severity: body.severity,
      title: body.title,
      description: body.description,
      status: 'Open' as const,
      reportedBy: user?.id || 'u-001',
      created: new Date(),
    }
    mockDb.addIncident(newIncident)
    return HttpResponse.json(newIncident, { status: 201 })
  }),

  http.patch(`${baseURL}/incidents/:id`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const incident = mockDb.getIncident(params.id as string)
    if (!incident) {
      return HttpResponse.json({ error: 'Incident not found' }, { status: 404 })
    }
    const body = await request.json() as any
    mockDb.updateIncident(params.id as string, body)
    return HttpResponse.json(mockDb.getIncident(params.id as string))
  }),

  http.post(`${baseURL}/incidents/:id/assign`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const incident = mockDb.getIncident(params.id as string)
    if (!incident) {
      return HttpResponse.json({ error: 'Incident not found' }, { status: 404 })
    }
    const body = await request.json() as any
    mockDb.updateIncident(params.id as string, {
      assignedTo: body.assignedTo,
      status: 'Acknowledged',
    })
    return HttpResponse.json(mockDb.getIncident(params.id as string))
  }),

  http.post(`${baseURL}/incidents/:id/resolve`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const incident = mockDb.getIncident(params.id as string)
    if (!incident) {
      return HttpResponse.json({ error: 'Incident not found' }, { status: 404 })
    }
    mockDb.updateIncident(params.id as string, {
      status: 'Resolved',
      resolved: new Date(),
    })
    return HttpResponse.json(mockDb.getIncident(params.id as string))
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
      organizationId: user?.orgId || 'ORG_DEMO',
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
      organizationId: user?.orgId || 'ORG_DEMO',
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

  http.post(`${baseURL}/webhooks/:id/test`, async ({ params }) => {
    // Mock webhook test
    return HttpResponse.json({ success: true, statusCode: 200 })
  }),

  // Billing endpoints
  http.get(`${baseURL}/billing/invoices`, async ({ request }) => {
    // Return mock invoices
    const mockInvoices = [
      {
        id: 'INV-2024-0012',
        type: 'Usage',
        org: 'Volt Mobility Ltd',
        amount: 12450.00,
        currency: 'USD',
        status: 'Paid',
        issuedAt: '2024-12-01',
        dueAt: '2024-12-15',
        paidAt: '2024-12-10',
        description: 'November 2024 Usage - 4,532 sessions',
      },
    ]
    return HttpResponse.json(mockInvoices)
  }),

  http.get(`${baseURL}/billing/invoices/:id`, async ({ params }) => {
    // Return mock invoice detail
    const invoice = {
      id: params.id,
      type: 'Usage',
      org: 'Volt Mobility Ltd',
      amount: 12450.00,
      currency: 'USD',
      status: 'Paid',
      issuedAt: '2024-12-01',
      dueAt: '2024-12-15',
      paidAt: '2024-12-10',
      description: 'November 2024 Usage - 4,532 sessions',
      lineItems: [
        { description: 'Charging Sessions', quantity: 4532, unitPrice: 2.75, total: 12463.00 },
      ],
    }
    return HttpResponse.json(invoice)
  }),

  http.post(`${baseURL}/billing/invoices/generate`, async ({ request }) => {
    const body = await request.json() as any
    const newInvoice = {
      id: `INV-${Date.now()}`,
      type: body.type,
      org: 'Organization',
      amount: 1000.00,
      currency: 'USD',
      status: 'Pending',
      issuedAt: new Date().toISOString().split('T')[0],
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: body.description || 'Generated invoice',
    }
    return HttpResponse.json(newInvoice, { status: 201 })
  }),

  // Stop session endpoint
  http.post(`${baseURL}/sessions/:id/stop`, async ({ params, request }) => {
    const { mockDb } = await import('@/data/mockDb')
    const session = mockDb.getSession(params.id as string)
    if (!session) {
      return HttpResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    const body = await request.json() as any
    mockDb.updateSession(params.id as string, {
      status: 'Cancelled',
      end: new Date(),
    })
    const updated = mockDb.getSession(params.id as string)
    // Map to API format
    return HttpResponse.json({
      id: updated!.id,
      userId: updated!.driverId || 'u-001',
      stationId: updated!.stationId,
      connectorId: updated!.connectorId?.toString(),
      startedAt: updated!.start.toISOString(),
      endedAt: updated!.end?.toISOString(),
      status: 'STOPPED',
      energyDelivered: updated!.energyKwh,
      cost: updated!.amount,
    })
  }),
]
