import type { Role } from '@/core/auth/types'

export type MenuItem = { label: string; path: string }

export function menuFor(role: Role, ownerCapability?: 'CHARGE' | 'SWAP' | 'BOTH'): MenuItem[] {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'EVZONE_ADMIN':
      return [
        { label: 'Overview', path: '/admin' },
        { label: 'Stations (Global)', path: '/admin/stations' },
        { label: 'Users & Roles (RBAC)', path: '/admin/users' },
        { label: 'Incidents', path: '/admin/incidents' },
        { label: 'Dispatches', path: '/admin/dispatches' },
        { label: 'Support Desk', path: '/admin/support' },
        { label: 'System Health & Monitoring', path: '/admin/health' },
        { label: 'Audit Logs & Compliance', path: '/admin/audit' },
        { label: 'Billing / Payments / Reconciliation', path: '/admin/billing' },
        { label: 'Data Exports & Reporting', path: '/admin/reports' },
        { label: 'Customer & Partner CRM Tools', path: '/admin/crm' },
        { label: 'OCPI Roaming', path: '/admin/ocpi' },
        { label: 'OCPP Queue', path: '/admin/ocpp' },
        { label: 'MQTT Monitoring', path: '/admin/mqtt' },
        { label: 'Webhooks Log', path: '/admin/webhooks' },
        { label: 'Global Configuration', path: '/admin/settings' },
        { label: 'Notifications Center', path: '/admin/notifications' },
        { label: 'Refunds & Disputes', path: '/admin/disputes' },
        { label: 'KYC / Partner Compliance', path: '/admin/kyc' },
        { label: 'Access Reviews + Privileged Actions', path: '/admin/access-reviews' },
        { label: 'Broadcast / Comms Center', path: '/admin/broadcasts' },
        { label: 'Integration Keys / Webhooks / Secrets', path: '/admin/integrations' },
        { label: 'Data Governance / Privacy Requests', path: '/admin/privacy' },
        { label: 'Status Page / External Incident Comms', path: '/admin/status' },
      ]
    case 'EVZONE_OPERATOR':
      return [
        { label: 'Overview', path: '/operator' },
        { label: 'Stations (Region)', path: '/operator/stations' },
        { label: 'Create Stations', path: '/operator/stations/create' },
        { label: 'Users & Approvals', path: '/operator/approvals' },
        { label: 'Jobs & Dispatch', path: '/operator/dispatch' },
        { label: 'Sessions', path: '/operator/sessions' },
        { label: 'Incidents', path: '/operator/incidents' },
        { label: 'Reports', path: '/operator/reports' },
        { label: 'Wallet / Settlements', path: '/operator/billing' },
        { label: 'Messaging / Notices', path: '/operator/messages' },
        { label: 'Settings', path: '/operator/settings' },
      ]
    case 'SITE_OWNER':
      return [
        { label: 'Overview', path: '/site-owner' },
        { label: 'My Sites & Availability', path: '/site-owner/sites' },
        { label: 'Applications Pipeline', path: '/site-owner/applications' },
        { label: 'Leases & Tenants', path: '/site-owner/leases' },
        { label: 'Earnings & Payouts', path: '/site-owner/earnings' },
        { label: 'Wallet / Ledger', path: '/site-owner/ledger' },
        { label: 'Performance', path: '/site-owner/performance' },
        { label: 'Messages', path: '/site-owner/messages' },
        { label: 'Documents / Verification', path: '/site-owner/docs' },
        { label: 'Settings', path: '/site-owner/settings' },
      ]
    case 'OWNER': {
      const base = ownerCapability === 'SWAP' ? '/owner/swap' : ownerCapability === 'BOTH' ? '/owner/both' : '/owner/charge'
      if (ownerCapability === 'SWAP') {
        return [
          { label: 'Overview', path: base },
          { label: 'My Swap Stations', path: base + '/stations' },
          { label: 'Battery Inventory', path: base + '/inventory' },
          { label: 'Swap Bookings', path: base + '/bookings' },
          { label: 'Swap Sessions', path: base + '/sessions' },
          { label: 'Pricing / Plans', path: base + '/pricing' },
          { label: 'Battery Health / Lifecycle', path: base + '/health' },
          { label: 'Logistics', path: base + '/logistics' },
          { label: 'Maintenance & Work Orders', path: base + '/maintenance' },
          { label: 'Team & Roles', path: base + '/team' },
          { label: 'Settlements / Payouts', path: base + '/billing' },
          { label: 'Reports', path: base + '/reports' },
          { label: 'Settings', path: base + '/settings' },
        ]
      }
      if (ownerCapability === 'BOTH') {
        return [
          { label: 'Overview', path: base },
          { label: 'Stations (All)', path: base + '/stations' },
          { label: 'Charging', path: base + '/charge' },
          { label: 'Swapping', path: base + '/swap' },
          { label: 'Sessions', path: base + '/sessions' },
          { label: 'Bookings', path: base + '/bookings' },
          { label: 'Pricing', path: base + '/pricing' },
          { label: 'Integrations / Roaming', path: base + '/roaming' },
          { label: 'Incidents & Maintenance', path: base + '/maintenance' },
          { label: 'Team & Roles', path: base + '/team' },
          { label: 'Revenue / Wallet', path: base + '/billing' },
          { label: 'Reports', path: base + '/reports' },
          { label: 'Settings', path: base + '/settings' },
        ]
      }
      // CHARGE default
      return [
        { label: 'Overview', path: base },
        { label: 'My Charging Stations', path: base + '/stations' },
        { label: 'Charge Points / Connectors', path: base + '/connectors' },
        { label: 'Sessions & Transactions', path: base + '/sessions' },
        { label: 'Pricing / Tariffs', path: base + '/pricing' },
        { label: 'Customers / Accounts', path: base + '/customers' },
        { label: 'Wallet / Revenue', path: base + '/billing' },
        { label: 'Maintenance & Work Orders', path: base + '/maintenance' },
        { label: 'Team & Roles', path: base + '/team' },
        { label: 'Reports', path: base + '/reports' },
        { label: 'Settings', path: base + '/settings' },
      ]
    }
    case 'STATION_ADMIN':
      return [
        { label: 'Overview', path: '/station-admin' },
        { label: 'Station Configuration', path: '/station-admin/config' },
        { label: 'Devices / Assets', path: '/station-admin/assets' },
        { label: 'Staff & Roles', path: '/station-admin/staff' },
        { label: 'Shifts / Attendance', path: '/station-admin/shifts' },
        { label: 'Sessions / Swaps', path: '/station-admin/sessions' },
        { label: 'Cash / POS / Receipts', path: '/station-admin/cash' },
        { label: 'Incidents', path: '/station-admin/incidents' },
        { label: 'Maintenance Requests', path: '/station-admin/maintenance' },
        { label: 'Reports', path: '/station-admin/reports' },
        { label: 'Settings', path: '/station-admin/settings' },
      ]
    case 'MANAGER':
      return [
        { label: 'Overview', path: '/manager' },
        { label: 'My Stations', path: '/manager/stations' },
        { label: 'Attendants', path: '/manager/attendants' },
        { label: 'Technicians', path: '/manager/technicians' },
        { label: 'Shifts / Rosters', path: '/manager/shifts' },
        { label: 'Sessions / Swaps', path: '/manager/sessions' },
        { label: 'Incidents', path: '/manager/incidents' },
        { label: 'Maintenance & Work Orders', path: '/manager/maintenance' },
        { label: 'Reports', path: '/manager/reports' },
        { label: 'Settings', path: '/manager/settings' },
      ]
    case 'ATTENDANT':
      return [
        { label: 'Live Operations', path: '/attendant' },
        { label: 'Start / End Shift + Handover', path: '/attendant/shift' },
        { label: 'Sessions / Swaps', path: '/attendant/sessions' },
        { label: 'Queue / Walk-ins', path: '/attendant/queue' },
        { label: 'Payments / Receipts', path: '/attendant/payments' },
        { label: 'Incidents / Faults', path: '/attendant/incidents' },
        { label: 'Customer Help', path: '/attendant/support' },
        { label: 'Settings', path: '/attendant/settings' },
      ]
    case 'TECHNICIAN_ORG':
      return [
        { label: 'My Jobs', path: '/technician/org' },
        { label: 'Job Details / Checklists', path: '/technician/org/jobs' },
        { label: 'Assets & Diagnostics', path: '/technician/org/diagnostics' },
        { label: 'Parts / Inventory', path: '/technician/org/parts' },
        { label: 'Time & Notes', path: '/technician/org/time' },
        { label: 'Reports', path: '/technician/org/reports' },
        { label: 'Settings', path: '/technician/org/settings' },
      ]
    case 'TECHNICIAN_PUBLIC':
      return [
        { label: 'Job Board', path: '/technician/public' },
        { label: 'My Schedule & Availability', path: '/technician/public/schedule' },
        { label: 'Active Jobs', path: '/technician/public/active' },
        { label: 'Completed Jobs', path: '/technician/public/completed' },
        { label: 'Earnings / Payouts', path: '/technician/public/earnings' },
        { label: 'Ratings / Compliance', path: '/technician/public/ratings' },
        { label: 'Settings', path: '/technician/public/settings' },
      ]
  }
}

