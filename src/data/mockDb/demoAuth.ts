import type { OwnerCapability, Role } from '@/core/auth/types'

export type DemoAuthUser = {
  id: string
  name: string
  email?: string
  phone?: string
  role: Role
  ownerCapability?: OwnerCapability
}

export const DEMO_AUTH_PASSWORD = 'demo'

export const DEMO_AUTH_USERS: DemoAuthUser[] = [
  { id: 'demo-super-001', name: 'Super Admin', email: 'super@demo.evzone', role: 'SUPER_ADMIN' },
  { id: 'demo-admin-001', name: 'Admin', email: 'admin@demo.evzone', role: 'EVZONE_ADMIN' },
  { id: 'demo-ops-001', name: 'Operator', email: 'operator@demo.evzone', phone: '+1000000001', role: 'EVZONE_OPERATOR' },
  { id: 'demo-owner-001', name: 'Station Owner', email: 'owner@demo.evzone', role: 'OWNER', ownerCapability: 'CHARGE' },
  { id: 'demo-site-001', name: 'Site Owner', email: 'site@demo.evzone', role: 'SITE_OWNER' },
  { id: 'demo-station-admin-001', name: 'Station Admin', email: 'stationadmin@demo.evzone', role: 'STATION_ADMIN' },
  { id: 'demo-manager-001', name: 'Manager', email: 'manager@demo.evzone', role: 'MANAGER' },
  { id: 'demo-attendant-001', name: 'Attendant', email: 'attendant@demo.evzone', role: 'ATTENDANT' },
  { id: 'demo-tech-org-001', name: 'Tech Org', email: 'tech@demo.evzone', role: 'TECHNICIAN_ORG' },
  { id: 'demo-tech-public-001', name: 'Tech Public', email: 'publictech@demo.evzone', role: 'TECHNICIAN_PUBLIC' },
]

export function findDemoUser(email?: string, phone?: string): DemoAuthUser | undefined {
  const normalizedEmail = email?.trim().toLowerCase()
  const normalizedPhone = phone?.trim()

  return DEMO_AUTH_USERS.find((user) => {
    if (normalizedEmail && user.email?.toLowerCase() === normalizedEmail) return true
    if (normalizedPhone && user.phone === normalizedPhone) return true
    return false
  })
}
