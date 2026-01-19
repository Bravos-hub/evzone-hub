/**
 * Mock Database
 * In-memory database with localStorage persistence for MVP
 */

import type {
  Station,
  ChargePoint,
  ChargingSession,
  Incident,
  Tariff,
  Webhook,
  User,
  Invoice,
  ParkingBay,
  SwapProvider
} from '@/core/types/domain'
import type {
  Tenant,
  TenantApplication,
  LeaseContract,
  ApplicationDocument,
  Site
} from '@/core/api/types'
import type { Battery as ApiBattery } from '@/core/api/types'
import { mockChargingSessions } from './sessions'
import { mockUsers } from './users'

// Import types for entities we'll define
export type Dispatch = {
  id: string
  title: string
  description: string
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'
  priority: 'Critical' | 'High' | 'Normal' | 'Low'
  stationId: string
  stationName: string
  stationAddress: string
  stationChargers: number
  ownerName: string
  ownerContact: string
  assignee: string
  assigneeContact: string
  createdAt: string
  createdBy: string
  dueAt: string
  estimatedDuration: string
  incidentId?: string
  requiredSkills: string[]
  notes?: string
}

export type AuditLogEntry = {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  category: 'Auth' | 'Config' | 'User' | 'Station' | 'Billing' | 'System'
  action: string
  target: string
  details: string
  ip: string
  severity: 'Info' | 'Warning' | 'Critical'
}

const initialInvoices: Invoice[] = [
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
  {
    id: 'INV-2024-0011',
    type: 'Subscription',
    org: 'Volt Mobility Ltd',
    amount: 2500.00,
    currency: 'USD',
    status: 'Paid',
    issuedAt: '2024-12-01',
    dueAt: '2024-12-15',
    paidAt: '2024-12-05',
    description: 'Pro Plan - December 2024',
  },
]

// Initial mock data
const initialStations: Station[] = [
  {
    id: 'STATION_001',
    name: 'Central Hub',
    type: 'Charging',
    organizationId: 'ORG_DEMO',
    address: '123 Main St, Downtown',
    city: 'Kampala',
    region: 'AFRICA',
    country: 'Uganda',
    latitude: 0.3476,
    longitude: 32.5825,
    status: 'Online',
    capacity: 150,
    parkingBays: 150,
    created: new Date('2024-01-15'),
    tags: ['premium', 'high-traffic'],
  },
  {
    id: 'STATION_002',
    name: 'Airport East',
    type: 'Charging',
    organizationId: 'ORG_ALPHA',
    address: '456 Airport Blvd',
    city: 'Entebbe',
    region: 'AFRICA',
    country: 'Uganda',
    latitude: 0.0424,
    longitude: 32.4435,
    status: 'Online',
    capacity: 200,
    parkingBays: 200,
    created: new Date('2024-02-20'),
    tags: ['airport', 'public'],
  },
]

const initialChargePoints: ChargePoint[] = [
  {
    id: 'CP-001',
    stationId: 'STATION_001',
    model: 'Terra 54',
    manufacturer: 'ABB',
    serialNumber: 'SN-2024-001',
    firmwareVersion: '1.2.3',
    status: 'Online',
    connectors: [
      {
        id: 1,
        type: 'CCS',
        powerType: 'DC',
        maxPowerKw: 50,
        status: 'Available',
      },
      {
        id: 2,
        type: 'Type2',
        powerType: 'AC',
        maxPowerKw: 22,
        status: 'Available',
      },
    ],
    ocppStatus: 'Available',
    lastHeartbeat: new Date(),
  },
  {
    id: 'CP-002',
    stationId: 'STATION_001',
    model: 'DC Wall 25',
    manufacturer: 'Delta',
    serialNumber: 'SN-2024-002',
    firmwareVersion: '1.1.5',
    status: 'Degraded',
    connectors: [
      {
        id: 1,
        type: 'CHAdeMO',
        powerType: 'DC',
        maxPowerKw: 50,
        status: 'Faulted',
      },
      {
        id: 2,
        type: 'CCS',
        powerType: 'DC',
        maxPowerKw: 50,
        status: 'Available',
      },
    ],
    ocppStatus: 'Faulted',
    lastHeartbeat: new Date(Date.now() - 3600000),
  },
]

const initialIncidents: Incident[] = [
  {
    id: 'INC-2401',
    stationId: 'STATION_001',
    severity: 'Critical',
    title: 'Mobile money confirmations delayed',
    description: 'Spike in top-ups not reflecting. Suspected payment webhook delays.',
    status: 'Open',
    reportedBy: 'u-001',
    created: new Date('2024-12-24T09:25:00'),
    slaDeadline: new Date('2024-12-24T12:25:00'),
  },
  {
    id: 'INC-2392',
    stationId: 'STATION_001',
    severity: 'High',
    title: 'Charging sessions stuck at starting',
    description: 'Partial outage affecting session state transitions.',
    status: 'In-Progress',
    reportedBy: 'u-002',
    assignedTo: 'u-001',
    created: new Date('2024-12-20T10:30:00'),
    acknowledged: new Date('2024-12-20T10:35:00'),
    slaDeadline: new Date('2024-12-20T14:30:00'),
  },
]

const initialDispatches: Dispatch[] = [
  {
    id: 'DSP-001',
    title: 'Connector replacement - Bay 3',
    description: 'The connector on Bay 3 is damaged and needs immediate replacement.',
    status: 'Assigned',
    priority: 'High',
    stationId: 'STATION_001',
    stationName: 'Central Hub',
    stationAddress: '123 Main St, Downtown',
    stationChargers: 8,
    ownerName: 'John Ssemakula',
    ownerContact: '+256 700 123 456',
    assignee: 'Allan Tech',
    assigneeContact: '+256 701 111 111',
    createdAt: '2024-12-24 08:00',
    createdBy: 'Manager James',
    dueAt: '2024-12-24 14:00',
    estimatedDuration: '2h',
    incidentId: 'INC-2392',
    requiredSkills: ['OCPP', 'Electrical'],
  },
]

const initialTariffs: Tariff[] = [
  {
    id: 'TAR-001',
    name: 'Standard Rate',
    type: 'Energy-based',
    paymentModel: 'Postpaid',
    organizationId: 'ORG_DEMO',
    currency: 'USD',
    active: true,
    elements: [
      {
        pricePerKwh: 0.35,
      },
    ],
    applicableStations: ['STATION_001', 'STATION_002'],
  },
  {
    id: 'TAR-002',
    name: 'Peak Hours',
    type: 'Time-based',
    paymentModel: 'Postpaid',
    organizationId: 'ORG_DEMO',
    currency: 'USD',
    active: true,
    elements: [
      {
        pricePerKwh: 0.50,
        period: 'Peak',
      },
    ],
  },
]

const initialWebhooks: Webhook[] = [
  {
    id: 'WH-001',
    organizationId: 'ORG_DEMO',
    name: 'Partner Events',
    url: 'https://api.partner.com/events',
    events: ['session.started', 'session.completed'],
    secret: 'secret-key-123',
    status: 'Active',
    retryCount: 3,
    lastTrigger: new Date(Date.now() - 120000),
  },
  {
    id: 'WH-002',
    organizationId: 'ORG_DEMO',
    name: 'Billing Webhook',
    url: 'https://billing.internal/hooks',
    events: ['payment.completed'],
    secret: 'secret-key-456',
    status: 'Active',
    retryCount: 3,
    lastTrigger: new Date(Date.now() - 900000),
  },
]

const initialProviders: SwapProvider[] = [
  {
    id: 'prov-001',
    name: 'Gogoro',
    region: 'Taiwan / Global',
    standard: 'Gogoro G2',
    batteriesSupported: ['G2 Battery', 'G2 Plus'],
    stationCount: 2500,
    website: 'https://www.gogoro.com',
    status: 'Active',
    partnerSince: new Date('2023-01-10'),
  },
  {
    id: 'prov-002',
    name: 'Spiro',
    region: 'Africa (Benin, Togo, Rwanda)',
    standard: 'Spiro S1',
    batteriesSupported: ['Spiro Pack Alpha', 'Spiro Pack Beta'],
    stationCount: 450,
    website: 'https://spiro.mobility',
    status: 'Active',
    partnerSince: new Date('2023-05-15'),
  },
  {
    id: 'prov-003',
    name: 'NIO',
    region: 'China / Europe',
    standard: 'NIO BaaS',
    batteriesSupported: ['75kWh Standard', '100kWh Long Range'],
    stationCount: 2200,
    website: 'https://www.nio.com',
    status: 'Active',
    partnerSince: new Date('2024-02-01'),
  },
  {
    id: 'prov-004',
    name: 'Zembo',
    region: 'East Africa (Uganda)',
    standard: 'Zembo Standard',
    batteriesSupported: ['Zembo Power 1'],
    stationCount: 50,
    website: 'https://www.zembo.bike',
    status: 'Active',
    partnerSince: new Date('2022-11-20'),
  },
  {
    id: 'prov-005',
    name: 'Battery Smart',
    region: 'India',
    standard: 'BatterySmart',
    batteriesSupported: ['LFP 48V', 'NMC 60V'],
    stationCount: 1200,
    website: 'https://www.batterysmart.in',
    status: 'Active',
    partnerSince: new Date('2023-08-12'),
  },
]

const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'AUD-001',
    timestamp: '2024-12-24 09:45:23',
    actor: 'Sarah Chen',
    actorRole: 'Admin',
    category: 'Config',
    action: 'Feature flag toggled',
    target: 'dark_mode_beta',
    details: 'Enabled for all users',
    ip: '192.168.1.1',
    severity: 'Info',
  },
  {
    id: 'AUD-002',
    timestamp: '2024-12-24 09:30:15',
    actor: 'John Operator',
    actorRole: 'Operator',
    category: 'Station',
    action: 'Station rebooted',
    target: 'ST-0001',
    details: 'Remote reboot initiated',
    ip: '10.0.0.5',
    severity: 'Warning',
  },
]

const initialSwapBatteries: ApiBattery[] = []

// Database interface
export interface MockDatabase {
  stations: Station[]
  chargePoints: ChargePoint[]
  sessions: ChargingSession[]
  incidents: Incident[]
  dispatches: Dispatch[]
  tariffs: Tariff[]
  webhooks: Webhook[]
  auditLogs: AuditLogEntry[]
  users: User[]
  invoices: Invoice[]
  parkingBays: ParkingBay[]
  tenants: Tenant[]
  applications: TenantApplication[]
  contracts: LeaseContract[]
  providers: SwapProvider[]
  swapBatteries: ApiBattery[]
}

// Load from localStorage or use initial data
function loadDatabase(): MockDatabase {
  const stored = localStorage.getItem('evzone:mockDb')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects
      return {
        stations: parsed.stations?.map((s: any) => ({
          ...s,
          created: new Date(s.created),
          lastMaintenance: s.lastMaintenance ? new Date(s.lastMaintenance) : undefined,
        })) || initialStations,
        chargePoints: parsed.chargePoints?.map((cp: any) => ({
          ...cp,
          lastHeartbeat: cp.lastHeartbeat ? new Date(cp.lastHeartbeat) : undefined,
          maxCapacityKw: cp.maxCapacityKw || 50,
          parkingBays: cp.parkingBays || [],
        })) || initialChargePoints,
        sessions: parsed.sessions?.map((s: any) => ({
          ...s,
          start: new Date(s.start),
          end: s.end ? new Date(s.end) : undefined,
        })) || mockChargingSessions,
        incidents: parsed.incidents?.map((i: any) => ({
          ...i,
          created: new Date(i.created),
          acknowledged: i.acknowledged ? new Date(i.acknowledged) : undefined,
          resolved: i.resolved ? new Date(i.resolved) : undefined,
          slaDeadline: i.slaDeadline ? new Date(i.slaDeadline) : undefined,
        })) || initialIncidents,
        dispatches: parsed.dispatches || initialDispatches,
        tariffs: parsed.tariffs?.map((t: any) => ({
          ...t,
          validFrom: t.validFrom ? new Date(t.validFrom) : undefined,
          validTo: t.validTo ? new Date(t.validTo) : undefined,
        })) || initialTariffs,
        webhooks: parsed.webhooks?.map((w: any) => ({
          ...w,
          lastTrigger: w.lastTrigger ? new Date(w.lastTrigger) : undefined,
        })) || initialWebhooks,
        auditLogs: parsed.auditLogs || initialAuditLogs,
        users: parsed.users?.map((u: any) => ({
          ...u,
          created: new Date(u.created),
          lastSeen: u.lastSeen ? new Date(u.lastSeen) : undefined,
        })) || mockUsers,
        invoices: parsed.invoices || initialInvoices,
        parkingBays: parsed.parkingBays || [],
        tenants: parsed.tenants || [],
        applications: parsed.applications || [],
        contracts: parsed.contracts || [],
        providers: parsed.providers?.map((p: any) => ({
          ...p,
          partnerSince: new Date(p.partnerSince),
        })) || initialProviders,
        swapBatteries: parsed.swapBatteries || initialSwapBatteries,
      }
    } catch (e) {
      console.error('Failed to parse stored database:', e)
    }
  }

  // Return initial data
  return {
    stations: initialStations,
    chargePoints: initialChargePoints,
    sessions: mockChargingSessions,
    incidents: initialIncidents,
    dispatches: initialDispatches,
    tariffs: initialTariffs,
    webhooks: initialWebhooks,
    auditLogs: initialAuditLogs,
    users: mockUsers,
    invoices: initialInvoices,
    parkingBays: [],
    tenants: [],
    applications: [],
    contracts: [],
    providers: initialProviders,
    swapBatteries: initialSwapBatteries,
  }
}

// Save to localStorage
function saveDatabase(db: MockDatabase): void {
  try {
    // Convert Date objects to ISO strings for storage
    const serializable = {
      stations: db.stations.map(s => ({
        ...s,
        created: s.created.toISOString(),
        lastMaintenance: s.lastMaintenance?.toISOString(),
      })),
      chargePoints: db.chargePoints.map(cp => ({
        ...cp,
        lastHeartbeat: cp.lastHeartbeat?.toISOString(),
      })),
      sessions: db.sessions.map(s => ({
        ...s,
        start: s.start.toISOString(),
        end: s.end?.toISOString(),
      })),
      incidents: db.incidents.map(i => ({
        ...i,
        created: i.created.toISOString(),
        acknowledged: i.acknowledged?.toISOString(),
        resolved: i.resolved?.toISOString(),
        slaDeadline: i.slaDeadline?.toISOString(),
      })),
      dispatches: db.dispatches,
      tariffs: db.tariffs.map(t => ({
        ...t,
        validFrom: t.validFrom?.toISOString(),
        validTo: t.validTo?.toISOString(),
      })),
      webhooks: db.webhooks.map(w => ({
        ...w,
        lastTrigger: w.lastTrigger?.toISOString(),
      })),
      auditLogs: db.auditLogs,
      users: db.users.map(u => ({
        ...u,
        created: u.created.toISOString(),
        lastSeen: u.lastSeen?.toISOString(),
      })),
      invoices: db.invoices,
      parkingBays: db.parkingBays,
      tenants: db.tenants,
      applications: db.applications,
      contracts: db.contracts,
      providers: db.providers.map(p => ({
        ...p,
        partnerSince: p.partnerSince.toISOString(),
      })),
      swapBatteries: db.swapBatteries,
    }
    localStorage.setItem('evzone:mockDb', JSON.stringify(serializable))
  } catch (e) {
    console.error('Failed to save database:', e)
  }
}

// Initialize database
let db: MockDatabase = loadDatabase()

// Database access functions
export const mockDb = {
  // Stations
  getStations: () => db.stations,
  getStation: (id: string) => db.stations.find(s => s.id === id),
  addStation: (station: Station) => {
    db.stations.push(station)
    saveDatabase(db)
  },
  updateStation: (id: string, updates: Partial<Station>) => {
    const index = db.stations.findIndex(s => s.id === id)
    if (index !== -1) {
      db.stations[index] = { ...db.stations[index], ...updates }
      saveDatabase(db)
    }
  },
  deleteStation: (id: string) => {
    db.stations = db.stations.filter(s => s.id !== id)
    saveDatabase(db)
  },

  // Charge Points
  getChargePoints: () => db.chargePoints,
  getChargePoint: (id: string) => db.chargePoints.find(cp => cp.id === id),
  getChargePointsByStation: (stationId: string) => db.chargePoints.filter(cp => cp.stationId === stationId),
  addChargePoint: (chargePoint: ChargePoint) => {
    db.chargePoints.push(chargePoint)
    saveDatabase(db)
  },
  updateChargePoint: (id: string, updates: Partial<ChargePoint>) => {
    const index = db.chargePoints.findIndex(cp => cp.id === id)
    if (index !== -1) {
      db.chargePoints[index] = { ...db.chargePoints[index], ...updates }
      saveDatabase(db)
    }
  },
  deleteChargePoint: (id: string) => {
    db.chargePoints = db.chargePoints.filter(cp => cp.id !== id)
    saveDatabase(db)
  },

  // Sessions
  getSessions: () => db.sessions,
  getSession: (id: string) => db.sessions.find(s => s.id === id),
  getSessionsByStation: (stationId: string) => db.sessions.filter(s => s.stationId === stationId),
  addSession: (session: ChargingSession) => {
    db.sessions.push(session)
    saveDatabase(db)
  },
  updateSession: (id: string, updates: Partial<ChargingSession>) => {
    const index = db.sessions.findIndex(s => s.id === id)
    if (index !== -1) {
      db.sessions[index] = { ...db.sessions[index], ...updates }
      saveDatabase(db)
    }
  },

  // Incidents
  getIncidents: () => db.incidents,
  getIncident: (id: string) => db.incidents.find(i => i.id === id),
  addIncident: (incident: Incident) => {
    db.incidents.push(incident)
    saveDatabase(db)
  },
  updateIncident: (id: string, updates: Partial<Incident>) => {
    const index = db.incidents.findIndex(i => i.id === id)
    if (index !== -1) {
      db.incidents[index] = { ...db.incidents[index], ...updates }
      saveDatabase(db)
    }
  },

  // Dispatches
  getDispatches: () => db.dispatches,
  getDispatch: (id: string) => db.dispatches.find(d => d.id === id),
  addDispatch: (dispatch: Dispatch) => {
    db.dispatches.push(dispatch)
    saveDatabase(db)
  },
  updateDispatch: (id: string, updates: Partial<Dispatch>) => {
    const index = db.dispatches.findIndex(d => d.id === id)
    if (index !== -1) {
      db.dispatches[index] = { ...db.dispatches[index], ...updates }
      saveDatabase(db)
    }
  },

  // Tariffs
  getTariffs: () => db.tariffs,
  getTariff: (id: string) => db.tariffs.find(t => t.id === id),
  addTariff: (tariff: Tariff) => {
    db.tariffs.push(tariff)
    saveDatabase(db)
  },
  updateTariff: (id: string, updates: Partial<Tariff>) => {
    const index = db.tariffs.findIndex(t => t.id === id)
    if (index !== -1) {
      db.tariffs[index] = { ...db.tariffs[index], ...updates }
      saveDatabase(db)
    }
  },
  deleteTariff: (id: string) => {
    db.tariffs = db.tariffs.filter(t => t.id !== id)
    saveDatabase(db)
  },

  // Webhooks
  getWebhooks: () => db.webhooks,
  getWebhook: (id: string) => db.webhooks.find(w => w.id === id),
  addWebhook: (webhook: Webhook) => {
    db.webhooks.push(webhook)
    saveDatabase(db)
  },
  updateWebhook: (id: string, updates: Partial<Webhook>) => {
    const index = db.webhooks.findIndex(w => w.id === id)
    if (index !== -1) {
      db.webhooks[index] = { ...db.webhooks[index], ...updates }
      saveDatabase(db)
    }
  },
  deleteWebhook: (id: string) => {
    db.webhooks = db.webhooks.filter(w => w.id !== id)
    saveDatabase(db)
  },

  // Audit Logs
  getAuditLogs: () => db.auditLogs,
  addAuditLog: (entry: AuditLogEntry) => {
    db.auditLogs.unshift(entry) // Add to beginning
    // Keep only last 1000 entries
    if (db.auditLogs.length > 1000) {
      db.auditLogs = db.auditLogs.slice(0, 1000)
    }
    saveDatabase(db)
  },

  // Users
  getUsers: () => db.users,
  getUser: (id: string) => db.users.find(u => u.id === id),
  addUser: (user: User) => {
    db.users.push(user)
    saveDatabase(db)
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const index = db.users.findIndex(u => u.id === id)
    if (index !== -1) {
      db.users[index] = { ...db.users[index], ...updates }
      saveDatabase(db)
    }
  },

  // Invoices
  getInvoices: () => db.invoices,
  getInvoice: (id: string) => db.invoices.find(i => i.id === id),
  addInvoice: (invoice: Invoice) => {
    db.invoices.push(invoice)
    saveDatabase(db)
  },
  updateInvoice: (id: string, updates: Partial<Invoice>) => {
    const index = db.invoices.findIndex(i => i.id === id)
    if (index !== -1) {
      db.invoices[index] = { ...db.invoices[index], ...updates }
      saveDatabase(db)
    }
  },

  // Parking Bays
  getParkingBays: () => db.parkingBays,
  getParkingBaysBySite: (siteId: string) => db.parkingBays.filter(b => b.siteId === siteId),
  getParkingBaysByCharger: (chargerId: string) => db.parkingBays.filter(b => b.chargerId === chargerId),
  addParkingBay: (bay: ParkingBay) => {
    db.parkingBays.push(bay)
    saveDatabase(db)
  },
  updateParkingBay: (id: string, updates: Partial<ParkingBay>) => {
    const index = db.parkingBays.findIndex(b => b.id === id)
    if (index !== -1) {
      db.parkingBays[index] = { ...db.parkingBays[index], ...updates }
      saveDatabase(db)
    }
  },
  deleteParkingBay: (id: string) => {
    db.parkingBays = db.parkingBays.filter(b => b.id !== id)
    saveDatabase(db)
  },

  // Tenants & Applications
  getTenants: () => db.tenants,
  getTenant: (id: string) => db.tenants.find(t => t.id === id),
  getApplications: () => db.applications,
  getContracts: () => db.contracts,
  getContract: (tenantId: string) => db.contracts.find(c => c.tenantId === tenantId),
  setTenants: (tenants: Tenant[]) => {
    db.tenants = tenants
    saveDatabase(db)
  },
  setApplications: (apps: TenantApplication[]) => {
    db.applications = apps
    saveDatabase(db)
  },
  setContracts: (contracts: LeaseContract[]) => {
    db.contracts = contracts
    saveDatabase(db)
  },
  updateApplicationStatus: (id: string, status: string, message?: string) => {
    const index = db.applications.findIndex(a => a.id === id)
    if (index !== -1) {
      db.applications[index] = {
        ...db.applications[index],
        status: status as any,
        respondedAt: new Date().toISOString(),
        responseMessage: message
      }
      saveDatabase(db)
    }
  },

  // Application submission
  createApplication: (data: any) => {
    const newApp: TenantApplication = {
      id: `APP-${Date.now()}`,
      applicantId: 'USER_TEMP', // Would come from auth in real app
      applicantName: data.contactPersonName,
      organizationName: data.organizationName,
      businessRegistrationNumber: data.businessRegistrationNumber,
      taxComplianceNumber: data.taxComplianceNumber,
      contactPersonName: data.contactPersonName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      physicalAddress: data.physicalAddress,
      companyWebsite: data.companyWebsite,
      yearsInEVBusiness: data.yearsInEVBusiness,
      existingStationsOperated: data.existingStationsOperated,
      siteId: data.siteId,
      siteName: db.stations.find(s => s.id === data.siteId)?.name || 'Unknown Site',
      preferredLeaseModel: data.preferredLeaseModel,
      businessPlanSummary: data.businessPlanSummary,
      sustainabilityCommitments: data.sustainabilityCommitments,
      additionalServices: data.additionalServices,
      estimatedStartDate: data.estimatedStartDate,
      status: 'Pending',
      message: data.message,
      createdAt: new Date().toISOString(),
      documents: []
    }
    db.applications.push(newApp)
    saveDatabase(db)
    return newApp
  },

  // Document upload
  uploadDocument: (applicationId: string, doc: any) => {
    const newDoc = {
      id: `DOC-${Date.now()}`,
      applicationId,
      category: doc.category,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      fileUrl: doc.fileUrl || `/uploads/${doc.fileName}`,
      uploadedAt: new Date().toISOString(),
      required: doc.required
    }

    const appIndex = db.applications.findIndex(a => a.id === applicationId)
    if (appIndex !== -1) {
      if (!db.applications[appIndex].documents) {
        db.applications[appIndex].documents = []
      }
      db.applications[appIndex].documents!.push(newDoc)
      saveDatabase(db)
    }
    return newDoc
  },

  // Update commercial terms (site owner sets these during approval)
  updateApplicationTerms: (id: string, terms: any) => {
    const index = db.applications.findIndex(a => a.id === id)
    if (index !== -1) {
      db.applications[index] = {
        ...db.applications[index],
        proposedRent: terms.proposedRent,
        proposedTerm: terms.proposedTerm,
        numberOfChargingPoints: terms.numberOfChargingPoints,
        totalPowerRequirement: terms.totalPowerRequirement,
        chargingTechnology: terms.chargingTechnology,
        targetCustomerSegment: terms.targetCustomerSegment
      }
      saveDatabase(db)
      return db.applications[index]
    }
    return null
  },

  // Providers
  getProviders: () => db.providers,
  getProvider: (id: string) => db.providers.find(p => p.id === id),
  addProvider: (provider: SwapProvider) => {
    db.providers.push(provider)
    saveDatabase(db)
  },
  updateProvider: (id: string, updates: Partial<SwapProvider>) => {
    const index = db.providers.findIndex(p => p.id === id)
    if (index !== -1) {
      db.providers[index] = { ...db.providers[index], ...updates }
      saveDatabase(db)
    }
  },

  // Swap Batteries
  getSwapBatteries: () => db.swapBatteries,
  getSwapBatteriesByStation: (stationId: string) => db.swapBatteries.filter(b => b.stationId === stationId),
  setSwapBatteriesForStation: (stationId: string, batteries: ApiBattery[]) => {
    db.swapBatteries = [
      ...db.swapBatteries.filter(b => b.stationId !== stationId),
      ...batteries.map(b => ({ ...b, stationId })),
    ]
    saveDatabase(db)
  },
}

// Note: Dispatch and AuditLogEntry are local types, not exported to avoid conflicts with API types

// Re-export existing
export * from './sessions'
export * from './users'
export * from './ocpi'
