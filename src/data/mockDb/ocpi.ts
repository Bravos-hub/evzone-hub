import type { OCPIPartner, OCPICDR } from '@/core/types/domain'

export const mockOCPIPartners: OCPIPartner[] = [
  {
    id: 'p-volt',
    name: 'VoltHub',
    role: 'CPO',
    country: 'UG',
    version: '2.2.1',
    endpoints: [
      { identifier: 'locations', url: 'https://api.volthub.io/ocpi/2.2.1/locations', role: 'CPO' },
      { identifier: 'sessions', url: 'https://api.volthub.io/ocpi/2.2.1/sessions', role: 'CPO' },
    ],
    token: 'OCPI_live_****9af2',
    lastSync: new Date('2025-10-29T11:42:00'),
    status: 'Active',
    syncErrors: 0,
  },
  {
    id: 'p-grid',
    name: 'GridGo',
    role: 'MSP',
    country: 'CN',
    version: '2.2.1',
    endpoints: [
      { identifier: 'cdrs', url: 'https://gridgo.api/ocpi/2.2.1/cdrs', role: 'MSP' },
      { identifier: 'tariffs', url: 'https://gridgo.api/ocpi/2.2.1/tariffs', role: 'MSP' },
    ],
    token: 'OCPI_live_****17c0',
    lastSync: new Date('2025-10-29T11:39:00'),
    status: 'Active',
    syncErrors: 0,
  },
  {
    id: 'p-park',
    name: 'ParkLane',
    role: 'CPO',
    country: 'KE',
    version: '2.2.1',
    endpoints: [
      { identifier: 'locations', url: 'https://api.parklane.ke/ocpi/2.2.1/locations', role: 'CPO' },
    ],
    token: 'OCPI_live_****3bc1',
    lastSync: new Date('2025-10-29T10:58:00'),
    status: 'Suspended',
    syncErrors: 2,
  },
]

export const mockOCPICDRs: OCPICDR[] = [
  {
    id: 'CDR-001',
    partnerId: 'p-volt',
    sessionId: 'EVZ-1184',
    start: new Date('2025-10-28T11:05:00'),
    end: new Date('2025-10-28T11:41:00'),
    energyKwh: 18.2,
    cost: 5.12,
    currency: 'USD',
    status: 'Acknowledged',
    syncAttempts: 1,
  },
  {
    id: 'CDR-002',
    partnerId: 'p-grid',
    sessionId: 'EVZ-1183',
    start: new Date('2025-10-28T10:10:00'),
    end: new Date('2025-10-28T10:39:00'),
    energyKwh: 12.3,
    cost: 3.72,
    currency: 'USD',
    status: 'Sent',
    syncAttempts: 1,
  },
]

