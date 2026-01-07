/**
 * MSW Request Handlers
 * Mock API handlers for demo mode
 */

import { http, HttpResponse } from 'msw'
import { mockUsers } from '@/data/mockDb/users'
import { mockChargingSessions } from '@/data/mockDb/sessions'
import type { User, Station, Booking, ChargingSession, WalletBalance, WalletTransaction, Organization, DashboardMetrics } from '@/core/api/types'
import { API_CONFIG } from '@/core/api/config'

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

// Mock Stations
const mockStations: Station[] = [
  {
    id: 'STATION_001',
    code: 'ST-001',
    name: 'Central Hub',
    address: '123 Main St, Downtown',
    latitude: 40.7128,
    longitude: -74.0060,
    type: 'CHARGING',
    status: 'ACTIVE',
    orgId: 'ORG_DEMO',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'STATION_002',
    code: 'ST-002',
    name: 'Airport East',
    address: '456 Airport Blvd',
    latitude: 40.6413,
    longitude: -73.7781,
    type: 'CHARGING',
    status: 'ACTIVE',
    orgId: 'ORG_ALPHA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'STATION_003',
    code: 'ST-003',
    name: 'Tech Park',
    address: '789 Innovation Dr',
    latitude: 37.7749,
    longitude: -122.4194,
    type: 'BOTH',
    status: 'ACTIVE',
    orgId: 'ORG_BETA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

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
    
    let stations = [...mockStations]
    if (status) {
      stations = stations.filter(s => s.status === status.toUpperCase())
    }
    if (orgId) {
      stations = stations.filter(s => s.orgId === orgId)
    }
    
    return HttpResponse.json(stations)
  }),

  http.get(`${baseURL}/stations/:id`, async ({ params }) => {
    const station = mockStations.find(s => s.id === params.id)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    return HttpResponse.json(station)
  }),

  http.get(`${baseURL}/stations/code/:code`, async ({ params }) => {
    const station = mockStations.find(s => s.code === params.code)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    return HttpResponse.json(station)
  }),

  http.get(`${baseURL}/stations/nearby`, async ({ request }) => {
    // Return nearby stations (simplified - just return all)
    return HttpResponse.json(mockStations)
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
    const body = await request.json() as Partial<Station>
    const newStation: Station = {
      id: `STATION_${Date.now()}`,
      code: body.code || `ST-${Date.now()}`,
      name: body.name || 'New Station',
      address: body.address || '',
      latitude: body.latitude || 0,
      longitude: body.longitude || 0,
      type: body.type || 'CHARGING',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockStations.push(newStation)
    return HttpResponse.json(newStation, { status: 201 })
  }),

  http.patch(`${baseURL}/stations/:id`, async ({ params, request }) => {
    const station = mockStations.find(s => s.id === params.id)
    if (!station) {
      return HttpResponse.json({ error: 'Station not found' }, { status: 404 })
    }
    const body = await request.json() as Partial<Station>
    Object.assign(station, body, { updatedAt: new Date().toISOString() })
    return HttpResponse.json(station)
  }),

  http.delete(`${baseURL}/stations/:id`, async ({ params }) => {
    return HttpResponse.json({ success: true })
  }),

  http.post(`${baseURL}/stations/:id/health`, async () => {
    return HttpResponse.json({ healthScore: 95 })
  }),

  // Session endpoints
  http.get(`${baseURL}/sessions/active`, async () => {
    // Map domain ChargingSession to API ChargingSession
    const active = mockChargingSessions
      .filter(s => s.status === 'Active' || !s.end)
      .map(s => ({
        id: s.id,
        userId: 'u-001', // Mock user ID
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
    const session = mockChargingSessions.find(s => s.id === params.id)
    if (!session) {
      return HttpResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    // Map domain ChargingSession to API ChargingSession
    const apiSession: ChargingSession = {
      id: session.id,
      userId: 'u-001',
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
    return HttpResponse.json({
      total: mockChargingSessions.length,
      active: mockChargingSessions.filter(s => s.status === 'Active' || !s.end).length,
      totalEnergy: mockChargingSessions.reduce((sum, s) => sum + (s.energyKwh || 0), 0),
      totalRevenue: mockChargingSessions.reduce((sum, s) => sum + (s.amount || 0), 0),
    })
  }),

  http.get(`${baseURL}/sessions/station/:stationId`, async ({ params, request }) => {
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get('active') === 'true'
    const sessions = mockChargingSessions.filter(s => s.stationId === params.stationId)
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
    const sessions = mockChargingSessions // Simplified - would filter by userId in real app
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
    
    let sessions = [...mockChargingSessions]
    if (status) {
      sessions = sessions.filter(s => s.status === status)
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
]
