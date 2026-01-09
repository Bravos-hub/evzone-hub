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
  organizationId?: string
  tenantId?: string
  region?: string
  status?: 'Active' | 'Pending' | 'Suspended' | 'Inactive'
  mfaEnabled?: boolean
  lastSeen?: string
  created?: string
  assignedStations?: string[]
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
  capacity?: number
  parkingBays?: number
  orgId?: string
  tags?: string[]
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
  tags?: string[]
}

export interface UpdateStationRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  capacity?: number
  parkingBays?: number
}

// Charge Point Types
export type ParkingStatus = 'Active' | 'Maintenance' | 'Reserved' | 'Inactive'

export interface ParkingBay {
  id: string
  siteId: string
  bay: string
  type: 'EV Charging' | 'Regular' | 'Handicap' | 'VIP'
  status: ParkingStatus
  chargerId?: string
  rate: number
  occupancy: number
  lastUsed: string
}

export interface Connector {
  id: number
  type: string
  powerType: 'AC' | 'DC'
  maxPowerKw: number
  status: 'Available' | 'Occupied' | 'Faulted' | 'Reserved'
}

export interface ChargePoint {
  id: string
  stationId: string
  model: string
  manufacturer: string
  serialNumber: string
  firmwareVersion: string
  status: 'Online' | 'Degraded' | 'Offline' | 'Maintenance'
  connectors: Connector[]
  maxCapacityKw?: number
  parkingBays?: string[]
  ocppStatus?: string
  lastHeartbeat?: string
}

export interface CreateChargePointRequest {
  stationId: string
  model: string
  manufacturer: string
  serialNumber: string
  firmwareVersion?: string
  connectors: Array<{
    type: string
    powerType: 'AC' | 'DC'
    maxPowerKw: number
  }>
  ocppId?: string
}

export interface UpdateChargePointRequest {
  model?: string
  manufacturer?: string
  serialNumber?: string
  firmwareVersion?: string
  status?: 'Online' | 'Degraded' | 'Offline' | 'Maintenance'
  maxCapacityKw?: number
  parkingBays?: string[]
  connectors?: Array<{
    id: number
    type: string
    powerType: 'AC' | 'DC'
    maxPowerKw: number
    status?: 'Available' | 'Occupied' | 'Faulted' | 'Reserved'
  }>
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
  updatedAt?: string
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


// Tenant Types
export interface OverduePayment {
  id: string
  amount: number
  dueDate: string
  daysOverdue: number
  description: string
}

export interface PaymentHistoryEntry {
  id: string
  amount: number
  date: string
  method: string
  reference: string
  status: 'completed' | 'pending' | 'failed'
}

export interface Tenant {
  id: string
  name: string
  type: 'Operator' | 'Owner' | 'Fleet'
  siteId: string
  siteName: string
  model: 'Revenue Share' | 'Fixed Rent' | 'Hybrid'
  terms: string
  startDate: string
  status: 'Active' | 'Pending' | 'Suspended' | 'Terminated'
  earnings: number
  outstandingDebt: number
  totalPaid: number
  overduePayments: OverduePayment[]
  nextPaymentDue?: {
    date: string
    amount: number
  }
  paymentHistory: PaymentHistoryEntry[]
  email?: string
  phone?: string
  organizationId?: string
}

export interface TenantApplication {
  id: string
  applicantId: string
  applicantName: string
  organizationId?: string
  organizationName?: string
  siteId: string
  siteName: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Negotiating'
  proposedRent?: number
  proposedTerm?: number
  message?: string
  createdAt: string
  respondedAt?: string
  responseMessage?: string
}

export interface LeaseContract {
  id: string
  siteId: string
  tenantId: string
  tenantName: string
  organizationId?: string
  status: 'Active' | 'Expiring' | 'Expired' | 'Terminated'
  startDate: string
  endDate: string
  rent: number
  currency: string
  paymentSchedule: 'Monthly' | 'Quarterly' | 'Annually'
  autoRenew: boolean
  model: 'Revenue Share' | 'Fixed Rent' | 'Hybrid'
  terms: string
  violations?: string[]
  stationIds?: string[]
}

export type NoticeType = 'payment_reminder' | 'overdue' | 'general'
export type NoticeChannel = 'in-app' | 'email' | 'sms'

export interface Notice {
  id: string
  tenantId: string
  tenantName: string
  type: NoticeType
  message: string
  channels: NoticeChannel[]
  status: 'sent' | 'pending' | 'failed'
  sentAt?: string
  createdAt: string
}

export interface NoticeRequest {
  tenantId: string
  type: NoticeType
  message: string
  channels: NoticeChannel[]
}

export type NotificationKind =
  | 'system'
  | 'alert'
  | 'info'
  | 'warning'
  | 'notice'
  | 'message'
  | 'payment'
  | 'application'

export interface NotificationItem {
  id: string
  kind: NotificationKind
  title: string
  message: string
  source: string
  read: boolean
  createdAt: string
  channels?: NoticeChannel[]
  status?: Notice['status']
  targetPath?: string
  metadata?: Record<string, string>
}

export type PaymentMethodType = 'mobile' | 'wallet' | 'card' | 'bank'

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  label: string
  phoneNumber?: string
  provider?: string
  walletType?: string
  walletAddress?: string
  cardLast4?: string
  cardBrand?: string
  cardExpiry?: string
  cardHolderName?: string
  accountNumber?: string
  bankName?: string
  routingNumber?: string
  accountHolderName?: string
  isVerified: boolean
  isDefault: boolean
  createdAt: string
}

export interface CreatePaymentMethodRequest {
  type: PaymentMethodType
  label: string
  phoneNumber?: string
  provider?: string
  walletType?: string
  walletAddress?: string
  cardNumber?: string
  cardExpiry?: string
  cardCvv?: string
  cardHolderName?: string
  accountNumber?: string
  bankName?: string
  routingNumber?: string
  accountHolderName?: string
}

export interface WithdrawalTransaction {
  id: string
  amount: number
  fee: number
  netAmount: number
  method: PaymentMethodType
  paymentMethodId: string
  paymentMethodLabel: string
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  reference: string
  createdAt: string
  completedAt?: string
  failureReason?: string
}

export interface WithdrawalRequest {
  amount: number
  method: PaymentMethodType
  paymentMethodId: string
  currency: string
}
