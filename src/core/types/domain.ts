// Domain types for EVzone Aggregator Platform

// ==================== Core Entities ====================

export type SessionId = string
export type StationId = string
export type OrganizationId = string
export type UserId = string
export type BookingId = string
export type TariffId = string
export type ChargePointId = string
export type ConnectorId = number
export type BatteryPackId = string
export type LockerId = string

// ==================== Session Management ====================

export type SessionStatus = 'Pending' | 'Active' | 'Completed' | 'Failed' | 'Cancelled'
export type PaymentMethod = 'Card' | 'Mobile Money' | 'Roaming' | 'Wallet' | 'Cash'

export interface ChargingSession {
  id: SessionId
  stationId: StationId
  site: string
  chargePointId: ChargePointId
  connectorId: ConnectorId
  driverId?: UserId
  start: Date
  end?: Date
  energyKwh?: number
  tariffId: TariffId
  tariffName: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: SessionStatus
  meterStart?: number
  meterEnd?: number
  failureReason?: string
}

export interface SwapSession {
  id: SessionId
  stationId: StationId
  riderId: UserId
  batteryPackIn?: BatteryPackId
  batteryPackOut: BatteryPackId
  lockerId: LockerId
  start: Date
  end?: Date
  duration: number // minutes
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  status: SessionStatus
  swapType: 'Standard' | 'Express' | 'Priority'
}

// ==================== Booking Management ====================

export type BookingStatus = 'Pending' | 'Approved' | 'Cancelled' | 'Expired—No‑Show' | 'Completed'

export interface ChargeBooking {
  id: BookingId
  stationId: StationId
  chargePointId: ChargePointId
  connectorId: ConnectorId
  driverId: UserId
  start: Date
  estimatedDuration: number // minutes
  status: BookingStatus
  amount?: number
  currency: string
  notes?: string
}

export interface SwapBooking {
  id: BookingId
  stationId: StationId
  riderId: UserId
  batteryPack: string // e.g., "48V 30Ah"
  lockerId: LockerId
  start: Date
  duration: number // minutes
  status: BookingStatus
  amount: number
  currency: string
  autoApprove?: boolean
}

// ==================== Station & Assets ====================

export type StationStatus = 'Online' | 'Degraded' | 'Offline' | 'Maintenance'
export type StationType = 'Charging' | 'Swap' | 'Both'
export type ConnectorType = 'Type1' | 'Type2' | 'CCS' | 'CHAdeMO' | 'GB/T'
export type PowerType = 'AC' | 'DC'

export interface Station {
  id: StationId
  name: string
  type: StationType
  organizationId: OrganizationId
  siteId?: string
  address: string
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
  status: StationStatus
  operatorId?: UserId
  managerId?: UserId
  capacity: number // total power in kW
  chargePoints?: ChargePoint[]
  swapLockers?: SwapLocker[]
  amenities?: string[]
  openingHours?: string
  created: Date
  lastMaintenance?: Date
}

export interface ChargePoint {
  id: ChargePointId
  stationId: StationId
  model: string
  manufacturer: string
  serialNumber: string
  firmwareVersion: string
  status: StationStatus
  connectors: Connector[]
  ocppStatus?: 'Available' | 'Preparing' | 'Charging' | 'SuspendedEVSE' | 'SuspendedEV' | 'Finishing' | 'Reserved' | 'Unavailable' | 'Faulted'
  lastHeartbeat?: Date
}

export interface Connector {
  id: ConnectorId
  type: ConnectorType
  powerType: PowerType
  maxPowerKw: number
  status: 'Available' | 'Occupied' | 'Faulted' | 'Reserved'
  currentSessionId?: SessionId
}

export interface SwapLocker {
  id: LockerId
  stationId: StationId
  position: number
  status: 'Available' | 'Occupied' | 'Faulted' | 'Reserved' | 'Charging'
  batteryPackId?: BatteryPackId
  batteryLevel?: number // 0-100
  temperature?: number
}

export interface BatteryPack {
  id: BatteryPackId
  specification: string // e.g., "48V 30Ah"
  voltage: number
  capacity: number // Ah
  currentLevel: number // 0-100
  cycleCount: number
  health: number // SOH 0-100
  status: 'Available' | 'In-Use' | 'Charging' | 'Out-of-Service' | 'Maintenance'
  lastSwap?: Date
  stationId?: StationId
  lockerId?: LockerId
}

// ==================== Pricing & Tariffs ====================

export type TariffType = 'Time-based' | 'Energy-based' | 'Fixed' | 'Dynamic'
export type PricingPeriod = 'Peak' | 'Off-Peak' | 'Standard'

export interface Tariff {
  id: TariffId
  name: string
  description?: string
  type: TariffType
  organizationId: OrganizationId
  currency: string
  active: boolean
  elements: TariffElement[]
  validFrom?: Date
  validTo?: Date
  applicableStations?: StationId[]
}

export interface TariffElement {
  pricePerKwh?: number
  pricePerMinute?: number
  pricePerSession?: number
  period?: PricingPeriod
  stepSize?: number
  minDuration?: number
  maxDuration?: number
}

// ==================== Organization & Users ====================

export type UserStatus = 'Active' | 'Invited' | 'Suspended' | 'Pending'

export interface Organization {
  id: OrganizationId
  name: string
  legalName?: string
  taxId?: string
  type: 'CPO' | 'eMSP' | 'Site Owner' | 'Operator'
  region: string
  country: string
  contactEmail: string
  status: 'Active' | 'Suspended' | 'Pending'
  created: Date
  stations?: StationId[]
  users?: UserId[]
  billingEnabled: boolean
}

export interface User {
  id: UserId
  name: string
  email: string
  phone?: string
  organizationId?: OrganizationId
  role: string // Using string to accommodate all roles
  status: UserStatus
  region?: string
  created: Date
  lastSeen?: Date
  mfaEnabled: boolean
  permissions?: string[]
  assignedStations?: StationId[]
}

// ==================== OCPI & Roaming ====================

export type OCPIRole = 'CPO' | 'MSP' | 'EMSP' | 'NSP'
export type OCPIStatus = 'Active' | 'Suspended' | 'Pending' | 'Failed'

export interface OCPIPartner {
  id: string
  name: string
  role: OCPIRole
  country: string
  version: string // e.g., "2.2.1"
  endpoints: OCPIEndpoint[]
  token: string
  lastSync?: Date
  status: OCPIStatus
  syncErrors?: number
}

export interface OCPIEndpoint {
  identifier: string
  url: string
  role: OCPIRole
}

export interface OCPICDR {
  id: string
  partnerId: string
  sessionId: SessionId
  start: Date
  end: Date
  energyKwh: number
  cost: number
  currency: string
  status: 'Sent' | 'Acknowledged' | 'Failed' | 'Pending'
  syncAttempts: number
}

// ==================== OCPP Management ====================

export type OCPPAction = 
  | 'RemoteStartTransaction'
  | 'RemoteStopTransaction'
  | 'Reset'
  | 'UnlockConnector'
  | 'ChangeConfiguration'
  | 'GetConfiguration'
  | 'UpdateFirmware'
  | 'TriggerMessage'

export type OCPPMessageStatus = 'Pending' | 'Sent' | 'Accepted' | 'Rejected' | 'Failed' | 'Timeout'

export interface OCPPMessage {
  id: string
  chargePointId: ChargePointId
  action: OCPPAction
  payload: any
  status: OCPPMessageStatus
  sent?: Date
  responded?: Date
  response?: any
  error?: string
}

// ==================== Jobs & Dispatch ====================

export type JobStatus = 'Open' | 'Assigned' | 'In-Progress' | 'Completed' | 'Cancelled' | 'SLA-Risk'
export type JobPriority = 'P0' | 'P1' | 'P2' | 'P3'
export type JobType = 'Maintenance' | 'Installation' | 'Inspection' | 'Repair' | 'Emergency'

export interface Job {
  id: string
  type: JobType
  priority: JobPriority
  title: string
  description: string
  stationId: StationId
  assetId?: string // ChargePointId or LockerId
  assignedTo?: UserId
  createdBy: UserId
  created: Date
  due?: Date
  slaDeadline?: Date
  status: JobStatus
  resolution?: string
  timeSpent?: number // minutes
  parts?: string[]
  photos?: string[]
  firstTimeFix?: boolean
}

// ==================== Incidents & Alerts ====================

export type IncidentSeverity = 'Critical' | 'High' | 'Medium' | 'Low'
export type IncidentStatus = 'Open' | 'Acknowledged' | 'In-Progress' | 'Resolved' | 'Closed'

export interface Incident {
  id: string
  stationId: StationId
  assetId?: string
  severity: IncidentSeverity
  title: string
  description: string
  status: IncidentStatus
  reportedBy: UserId
  assignedTo?: UserId
  created: Date
  acknowledged?: Date
  resolved?: Date
  slaDeadline?: Date
  slaBreach?: boolean
  relatedJobs?: string[]
}

// ==================== Financial & Billing ====================

export type PayoutStatus = 'Pending' | 'Scheduled' | 'Completed' | 'Failed' | 'Disputed'
export type TransactionType = 'Session' | 'Booking' | 'Refund' | 'Fee' | 'Payout' | 'Settlement'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  status: PayoutStatus
  userId?: UserId
  sessionId?: SessionId
  bookingId?: BookingId
  organizationId?: OrganizationId
  created: Date
  processed?: Date
  description?: string
}

export interface Settlement {
  id: string
  organizationId: OrganizationId
  period: { start: Date; end: Date }
  totalRevenue: number
  platformFee: number
  netAmount: number
  currency: string
  status: PayoutStatus
  sessions: SessionId[]
  exceptions?: string[]
  payoutDate?: Date
}

// ==================== Sites & Marketplace ====================

export type SiteStatus = 'Draft' | 'Listed' | 'Leased' | 'Unlisted'
export type LeaseStatus = 'Active' | 'Expiring' | 'Expired' | 'Terminated'
export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Negotiating'

export interface Site {
  id: string
  ownerId: UserId
  name: string
  address: string
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
  status: SiteStatus
  type: 'Parking' | 'Commercial' | 'Residential' | 'Public'
  capacity: number // number of charge points/lockers
  utilities: {
    powerAvailable: number // kW
    waterAccess: boolean
    security: boolean
  }
  rent?: number
  rentCurrency?: string
  availableFrom?: Date
  images?: string[]
  amenities?: string[]
}

export interface LeaseApplication {
  id: string
  siteId: string
  applicantId: UserId
  organizationId: OrganizationId
  status: ApplicationStatus
  proposedRent?: number
  proposedTerm?: number // months
  message?: string
  created: Date
  responded?: Date
  responseMessage?: string
}

export interface Lease {
  id: string
  siteId: string
  tenantId: UserId
  organizationId: OrganizationId
  status: LeaseStatus
  startDate: Date
  endDate: Date
  rent: number
  currency: string
  paymentSchedule: 'Monthly' | 'Quarterly' | 'Annually'
  autoRenew: boolean
  violations?: string[]
  stationIds?: StationId[]
}

// ==================== Smart Charging & Load Management ====================

export interface LoadPolicy {
  id: string
  organizationId: OrganizationId
  stationId?: StationId
  name: string
  maxLoad: number // kW
  curtailmentThreshold: number // %
  priority: 'FIFO' | 'Priority' | 'Fair-Share'
  active: boolean
  schedule?: {
    start: string // HH:MM
    end: string // HH:MM
    days: number[] // 0-6
  }
}

export interface SmartChargingRule {
  id: string
  organizationId: OrganizationId
  name: string
  type: 'Time-based' | 'Price-based' | 'Grid-signal' | 'Load-based'
  condition: any
  action: 'Limit' | 'Pause' | 'Resume' | 'Curtail'
  active: boolean
}

export interface OpenADREvent {
  id: string
  eventId: string
  type: 'OpenADR'
  level: 'HIGH' | 'MED' | 'LOW'
  start: Date
  end: Date
  status: 'Active' | 'Ended' | 'Cancelled'
  signalName: string
  signalType: string
  currentValue?: number
  affectedStations?: StationId[]
}

// ==================== Webhooks & Integrations ====================

export type WebhookStatus = 'Active' | 'Disabled' | 'Failed'
export type WebhookEvent = 
  | 'session.started'
  | 'session.completed'
  | 'session.failed'
  | 'booking.created'
  | 'booking.cancelled'
  | 'station.status'
  | 'incident.created'
  | 'payment.completed'
  | 'chargepoint.faulted'

export interface Webhook {
  id: string
  organizationId: OrganizationId
  name: string
  url: string
  events: WebhookEvent[]
  secret: string
  status: WebhookStatus
  retryCount: number
  lastTrigger?: Date
  lastStatus?: number
  failureCount?: number
}

export interface WebhookLog {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: any
  statusCode?: number
  response?: string
  sent: Date
  duration?: number // ms
  success: boolean
  retries: number
}

// ==================== Team Management ====================

export type ShiftStatus = 'Scheduled' | 'Active' | 'Completed' | 'Missed'

export interface Shift {
  id: string
  stationId: StationId
  userId: UserId
  role: 'Manager' | 'Attendant'
  start: Date
  end: Date
  status: ShiftStatus
  checkIn?: Date
  checkOut?: Date
  notes?: string
  handoverNotes?: string
}

export interface TeamMember {
  userId: UserId
  role: string
  assignedStations: StationId[]
  certifications?: string[]
  availability?: {
    days: number[]
    hours: { start: string; end: string }
  }
}

// ==================== Reports & Analytics ====================

export interface EnergyMetrics {
  totalKwh: number
  peakDemand: number
  avgSessionDuration: number
  utilization: number // %
  co2Saved: number // kg
  period: { start: Date; end: Date }
}

export interface FinancialMetrics {
  revenue: number
  cost: number
  profit: number
  currency: string
  sessions: number
  avgSessionValue: number
  period: { start: Date; end: Date }
}

export interface OperationalMetrics {
  uptime: number // %
  availability: number // %
  incidents: number
  mttr: number // mean time to repair (minutes)
  firstTimeFix: number // %
  slaBreach: number
  period: { start: Date; end: Date }
}

// ==================== Onboarding ====================

export type OnboardingStatus = 'Not-Started' | 'In-Progress' | 'Completed' | 'Awaiting-Approval'
export type OnboardingStep = 
  | 'profile'
  | 'organization'
  | 'payment'
  | 'team'
  | 'stations'
  | 'certifications'
  | 'tour'
  | 'verification'

export interface OnboardingProgress {
  userId: UserId
  role: string
  status: OnboardingStatus
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  data: any
  created: Date
  updated: Date
}

// ==================== Notifications ====================

export type NotificationType = 'Info' | 'Warning' | 'Error' | 'Success'
export type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Notification {
  id: string
  userId: UserId
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  link?: string
  read: boolean
  created: Date
}

// ==================== API & Authentication ====================

export interface APIKey {
  id: string
  organizationId: OrganizationId
  name: string
  key: string
  permissions: string[]
  active: boolean
  created: Date
  lastUsed?: Date
  expiresAt?: Date
}

// ==================== MQTT Monitoring ====================

export interface MQTTMetrics {
  connectedClients: number
  messagesPerSecond: number
  subscriptions: number
  topics: string[]
  uptime: number // seconds
  lastUpdate: Date
}

export interface MQTTTopic {
  topic: string
  subscribers: number
  messagesPerMinute: number
  lastMessage?: Date
}

