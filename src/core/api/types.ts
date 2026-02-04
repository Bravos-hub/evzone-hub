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
  role?: string
  country?: string
  region?: string
  subscribedPackage?: string
  accountType?: 'COMPANY' | 'INDIVIDUAL'
  companyName?: string
  tenantId?: string
  orgId?: string
  organizationId?: string
  fleetId?: string
  ownerCapability?: OwnerCapability
  assignedStations?: string[]
}

export interface InviteUserRequest {
  email: string
  role: string
  ownerCapability?: OwnerCapability
  assignedStations?: string[]
  orgId?: string
  organizationId?: string
  password?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email?: string
    role: string
    orgId?: string
    organizationId?: string
    assignedStations?: string[]
    ownerCapability?: OwnerCapability
    status?: 'Active' | 'Pending' | 'Suspended' | 'Inactive' | 'Invited' | 'AwaitingApproval' | 'Rejected'
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
  avatarUrl?: string
  phone?: string
  role: Role
  orgId?: string
  organizationId?: string
  tenantId?: string
  region?: string
  ownerCapability?: OwnerCapability
  status?: 'Active' | 'Pending' | 'Suspended' | 'Inactive' | 'Invited'
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
  role?: string
  orgId?: string
  organizationId?: string
  ownerCapability?: OwnerCapability
  assignedStations?: string[]
  status?: 'Active' | 'Pending' | 'Suspended' | 'Inactive' | 'Invited'
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
  providerId?: string // Link to SwapProvider
  capacity?: number
  parkingBays?: number
  orgId?: string
  ownerId?: string // Link to Station Owner (Tenant)
  operatorId?: string
  contractType?: 'FIXED' | 'REVENUE_SHARE' | 'HYBRID'
  revenueShare?: number // Percentage
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export type ProviderStandard = 'Gogoro G2' | 'NIO BaaS' | 'Zembo Standard' | 'Spiro S1' | 'BatterySmart' | 'Universal'

export interface SwapProvider {
  id: string
  name: string
  logoUrl?: string
  region: string
  standard: ProviderStandard
  batteriesSupported: string[]
  stationCount: number
  website?: string
  status: 'Active' | 'Pending' | 'Inactive'
  partnerSince: string
}

export interface CreateStationRequest {
  code: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'CHARGING' | 'SWAP' | 'BOTH'
  providerId?: string
  capacity?: number
  parkingBays?: number
  tags?: string[]
  siteId?: string
}

export interface UpdateStationRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  capacity?: number
  parkingBays?: number
  operatorId?: string
  contractType?: 'FIXED' | 'REVENUE_SHARE' | 'HYBRID'
  revenueShare?: number
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
  ocppId?: string
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
  ocppId?: string
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
  userName?: string
  stationId: string
  stationName?: string
  connectorId?: string
  startedAt: string
  endedAt?: string
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED'
  energyDelivered?: number
  cost?: number
  durationMinutes?: number
}

// Battery & Swap Types
export interface Battery {
  id: string
  type: string
  soc: number
  health: number
  status: 'Ready' | 'Charging' | 'Maintenance' | 'Faulted'
  location: string
  cycles?: number
  lastSwapped?: string
  stationId?: string
  bayId?: string
  providerId?: string
}

export interface BatteryInput {
  id: string
  type?: string
  soc?: number
  health?: number
  status?: Battery['status']
  location?: string
  cycles?: number
  lastSwapped?: string
  stationId?: string
  bayId?: string
  providerId?: string
}

export interface SwapSession {
  id: string
  stationId: string
  driverId: string
  batteryInId: string
  batteryOutId: string
  startedAt: string
  endedAt?: string
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED'
  fee: number
  energyExchanged?: number
}

export interface SwapsTodayMetric {
  stationId: string
  count: number
  date: string
}

export type SwapBayStatus = 'Available' | 'Occupied' | 'Charging' | 'Faulted' | 'Reserved'

export interface SwapBay {
  id: string
  stationId: string
  status: SwapBayStatus
  batteryId?: string
}

export interface SwapBayInput {
  id: string
  batteryId?: string
  status?: SwapBayStatus
}

export interface UpsertSwapBaysRequest {
  bays: SwapBayInput[]
}

export interface UpsertStationBatteriesRequest {
  batteries: BatteryInput[]
}

// Wallet Types
export interface WalletBalance {
  balance: number
  currency: string
}

export interface WalletTransaction {
  id: string
  stationId?: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  reference: string
  createdAt: string
}

export interface TopUpRequest {
  amount: number
}

export interface RevenueTrendPoint {
  date: string
  revenue: number
  cost: number
}

export interface UtilizationHour {
  hour: number
  day: string
  utilization: number
}

export interface StationPerformanceRank {
  stationId: string
  stationName: string
  revenue: number
  uptime: number
  sessions: number
}

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
  trends: {
    revenue: RevenueTrendPoint[]
    utilization: UtilizationHour[]
    topStations: StationPerformanceRank[]
    swaps?: Array<{ date: string; count: number }>
  }
  swaps?: {
    today: number
    total: number
    avgTime: string
  }
  inventory?: {
    ready: number
    charging: number
    maintenance: number
    total: number
  }
  batteryHealth?: {
    average: number
    lowHealthCount: number
  }
}

// Organization Types
export interface Organization {
  id: string
  name: string
  description?: string
  logoUrl?: string
  type: 'COMPANY' | 'INDIVIDUAL'
  paymentProvider?: string
  walletNumber?: string
  taxId?: string
  regId?: string
  address?: string
  city?: string
  users?: User[]
  createdAt: string
  updatedAt?: string
}

export interface CreateOrganizationRequest {
  name: string
  type?: string
}

// Site Types
export type SitePurpose = 'PERSONAL' | 'COMMERCIAL'
export type LeaseType = 'REVENUE_SHARE' | 'FIXED_RENT' | 'HYBRID'
export type Footfall = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
export type SiteLeaseType = 'REVENUE_SHARE' | 'FIXED_RENT' | 'HYBRID'
export type SiteFootfall = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
export type SiteStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'

export interface Site {
  id: string
  name: string
  city: string
  address: string
  powerCapacityKw: number
  parkingBays: number
  purpose: SitePurpose
  leaseType?: LeaseType
  expectedMonthlyPrice?: number
  expectedFootfall?: Footfall
  latitude?: number
  longitude?: number
  photos: string[]
  amenities: string[]
  tags: string[]
  ownerId: string
  status: SiteStatus
  createdAt: string
  updatedAt: string
}

export interface SiteLeaseDetails {
  leaseType: LeaseType
  expectedMonthlyPrice?: number
  expectedFootfall: Footfall
}

export interface CreateSiteRequest {
  name: string
  city: string
  address: string
  powerCapacityKw: number
  parkingBays: number
  purpose?: SitePurpose
  latitude?: number
  longitude?: number
  amenities?: string[]
  tags?: string[]
  photos?: string[]
  ownerId: string
  leaseDetails?: SiteLeaseDetails
}

export interface UpdateSiteRequest {
  name?: string
  city?: string
  address?: string
  powerCapacityKw?: number
  parkingBays?: number
  purpose?: SitePurpose
  leaseType?: LeaseType
  expectedMonthlyPrice?: number
  expectedFootfall?: Footfall
  latitude?: number
  longitude?: number
  amenities?: string[]
  tags?: string[]
  status?: SiteStatus
  photos?: string[]
}

export interface SiteDocument {
  id: string
  siteId: string
  title: string
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
  uploadedBy?: string
}

export interface UploadSiteDocumentRequest {
  siteId: string
  name: string
  type: string
  fileUrl: string
  fileSize?: number
  mimeType?: string
}

export interface StationStats {
  totalRevenue: number
  totalSessions: number
  totalEnergy: number
  averageSessionDuration: number
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
  type: 'Operator' | 'STATION_OWNER' | 'Fleet'
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

  // Organization Details
  organizationId?: string
  organizationName: string
  businessRegistrationNumber: string
  taxComplianceNumber?: string

  // Contact Information
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  companyWebsite?: string

  // Business Experience
  yearsInEVBusiness: string // '<1', '1-3', '3-5', '5+'
  existingStationsOperated?: number

  // Site & Proposal
  siteId: string
  siteName: string
  preferredLeaseModel: 'Revenue Share' | 'Fixed Rent' | 'Hybrid'
  businessPlanSummary: string
  sustainabilityCommitments?: string
  additionalServices?: string[] // ['EV Maintenance', 'Retail', 'Food & Beverage']
  estimatedStartDate?: string

  // Commercial Terms (Set by Site Owner during approval)
  proposedRent?: number // Set by site owner
  proposedTerm?: number // Set by site owner (in months)
  numberOfChargingPoints?: number // Set by site owner
  totalPowerRequirement?: number // Set by site owner (kW)
  chargingTechnology?: string[] // Set by site owner ['AC', 'DC Fast', 'Ultra-Fast', 'Battery Swap']
  targetCustomerSegment?: string[] // Set by site owner ['Public', 'Fleet', 'Residential']

  // Application Status
  status: 'Pending' | 'Approved' | 'Rejected' | 'Negotiating'
  message?: string // Initial application message
  createdAt: string
  respondedAt?: string
  responseMessage?: string

  // Review & Approval
  reviewedBy?: string
  reviewedAt?: string
  approvalNotes?: string

  // Lease Agreement
  leaseAgreementUrl?: string
  leaseSignedAt?: string
  leaseStartDate?: string
  leaseEndDate?: string

  // Documents
  documents?: ApplicationDocument[]
}

// Application Document Types
export interface ApplicationDocument {
  id: string
  applicationId: string
  category: 'Legal' | 'Financial' | 'Technical' | 'Experience' | 'Other'
  documentType: string // 'Certificate of Incorporation', 'Bank Reference', etc.
  fileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
  required: boolean
}

export interface CreateApplicationRequest {
  // Organization Details
  organizationName: string
  businessRegistrationNumber: string
  taxComplianceNumber?: string

  // Contact Information
  contactPersonName: string
  contactEmail: string
  contactPhone: string
  physicalAddress: string
  companyWebsite?: string

  // Business Experience
  yearsInEVBusiness: string
  existingStationsOperated?: number

  // Site & Proposal
  siteId: string
  preferredLeaseModel: 'Revenue Share' | 'Fixed Rent' | 'Hybrid'
  businessPlanSummary: string
  sustainabilityCommitments?: string
  additionalServices?: string[]
  estimatedStartDate?: string
  message?: string
}

export interface UploadDocumentRequest {
  applicationId: string
  category: 'Legal' | 'Financial' | 'Technical' | 'Experience' | 'Other'
  documentType: string
  file: File
  required: boolean
}

export interface UpdateApplicationTermsRequest {
  proposedRent: number
  proposedTerm: number // months
  numberOfChargingPoints: number
  totalPowerRequirement: number // kW
  chargingTechnology: string[]
  targetCustomerSegment: string[]
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

// Incident & Maintenance Types
export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface Incident {
  id: string
  stationId: string
  stationName: string
  chargerId?: string
  title: string
  description: string
  severity: IncidentSeverity
  status: IncidentStatus
  errorCode?: string
  reportedBy: string
  assignedTo?: string // User ID (Technician)
  assignedName?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  notes: MaintenanceNote[]
}

export interface MaintenanceNote {
  id: string
  incidentId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export interface MaintenanceDispatch {
  id: string
  incidentId: string
  technicianId: string
  scheduledAt: string
  status: 'PENDING' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'CANCELLED'
  arrivalAt?: string
  completionAt?: string
  initialFindings?: string
  resolutionSummary?: string
}

// Dispatch/Work Order Types
export type DispatchPriority = 'Critical' | 'High' | 'Normal' | 'Low'
export type DispatchStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'

export interface Dispatch {
  id: string
  title: string
  description: string
  priority: DispatchPriority
  status: DispatchStatus
  stationId: string
  stationName?: string
  assignee?: string
  assigneeContact?: string
  dueDate: string
  dueTime?: string
  estimatedDuration?: string
  incidentId?: string
  requiredSkills?: string[]
  createdAt: string
  updatedAt: string
  assignedTo?: string // Add compatibility
  stationAddress?: string
  stationChargers?: number
  ownerName?: string
  ownerContact?: string
  createdBy?: string
  dueAt?: string
  notes?: string
}

// System Health Types
export interface ServiceHealth {
  name: string
  status: 'Operational' | 'Degraded' | 'Down' | 'Maintenance'
  responseTime: number
  uptime?: string
  lastCheck: string
  metadata?: Record<string, any>
}

export interface SystemHealthResponse {
  status: 'Operational' | 'Degraded' | 'Down'
  uptime: number
  services: ServiceHealth[]
  lastIncident?: string | null
}

export interface ServiceLog {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context?: string
}

export interface SystemEvent {
  id: string
  time: string
  severity: 'error' | 'warning' | 'info' | 'resolved'
  message: string
  service?: string
}

export interface RestartServiceResponse {
  success: boolean
  message: string
}
