/**
 * API Types
 * TypeScript types for API requests and responses
 */

import type { Role, OwnerCapability } from '@/core/auth/types'

// Auth Types
export interface LoginRequest {
  email?: string
  phone?: string
  password: string
}

export interface RegisterRequest {
  name: string
  email?: string
  phone?: string
  password: string
  role: string
  tenantId?: string
  orgId?: string
  fleetId?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email?: string
    role: string
  }
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// User Types
export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  role: Role
  orgId?: string
  tenantId?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  phone?: string
}

// Station Types
export interface Station {
  id: string
  code: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'CHARGING' | 'SWAP' | 'BOTH'
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  orgId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateStationRequest {
  code: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'CHARGING' | 'SWAP' | 'BOTH'
}

export interface UpdateStationRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
}

// Booking Types
export interface Booking {
  id: string
  userId: string
  stationId: string
  connectorId?: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
}

export interface CreateBookingRequest {
  stationId: string
  connectorId?: string
  startTime: string
  endTime: string
}

export interface UpdateBookingStatusRequest {
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'
}

// Session Types
export interface ChargingSession {
  id: string
  userId: string
  stationId: string
  connectorId?: string
  startedAt: string
  endedAt?: string
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED'
  energyDelivered?: number
  cost?: number
}

// Wallet Types
export interface WalletBalance {
  balance: number
  currency: string
}

export interface WalletTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  reference: string
  createdAt: string
}

export interface TopUpRequest {
  amount: number
}

// Analytics Types
export interface DashboardMetrics {
  realTime: {
    activeSessions: number
    onlineChargers: number
    totalPower: number
    currentRevenue: number
  }
  today: {
    sessions: number
    energyDelivered: number
    revenue: number
  }
  chargers: {
    total: number
    online: number
    offline: number
    maintenance: number
  }
}

// Organization Types
export interface Organization {
  id: string
  name: string
  type: string
  createdAt: string
}

export interface CreateOrganizationRequest {
  name: string
  type?: string
}

// API Error Types
export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

