/**
 * Centralized Route Paths
 * 
 * Using constants for route paths prevents "magic strings" and makes
 * maintenance easier when paths change.
 */
export const PATHS = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    VERIFY_EMAIL: '/verify-email',
  },
  DASHBOARD: '/dashboard',
  STATIONS: {
    ROOT: '/stations',
    CHARGE_POINTS: '/stations/charge-points',
    SWAP_STATIONS: '/stations/swap-stations',
    SMART_CHARGING: '/stations/smart-charging',
    BOOKINGS: '/stations/bookings',
  },
  SESSIONS: '/sessions',
  INCIDENTS: '/incidents',
  DISPATCHES: '/dispatches',
  BILLING: '/billing',
  REPORTS: '/reports',
  TEAM: '/team',
  NOTIFICATIONS: '/notifications',

  // Admin Features
  ADMIN: {
    USERS: '/users',
    USER_DETAIL: (id: string) => `/users/${id}`,
    APPROVALS: '/approvals',
    AUDIT_LOGS: '/audit-logs',
    SYSTEM_HEALTH: '/system-health',
    GLOBAL_CONFIG: '/global-config',
    INTEGRATIONS: '/integrations',
    KYC: '/kyc-compliance',
    DISPUTES: '/disputes',
    BROADCASTS: '/broadcasts',
    PROTOCOLS: '/protocols',
    SETTLEMENT: '/settlement',
    PLANS: '/plans',
    FEATURE_FLAGS: '/feature-flags',
    WEBHOOKS_LOG: '/webhooks-log',
    WEBHOOKS: '/webhooks',
    SUPPORT: '/support-desk',
    PRIVACY: '/privacy-requests',
    CRM: '/crm',
    STATUS: '/status-page',
    ROLES: '/roles-matrix',
    ORGS: '/organizations',
    HOME: '/admin-home',
  },

  // Owner Features
  OWNER: {
    TARIFFS: '/tariffs',
    EARNINGS: '/earnings',
    BOOKING_LEDGER: '/booking-ledger',
    PRICING_RECIPES: '/pricing-recipes',
    LOAD_POLICY: '/load-policy',
    TECH_REQUESTS: '/tech-requests',
    ADD_CHARGER: '/add-charger',
    OPS: '/owner-ops',
    DISCOUNTS: '/discounts',
    STATION_MAP: '/station-map',
    ALERTS: '/owner-alerts',
    OPERATORS: '/operators',
    OPERATOR_REPORT: (id: string) => `/operators/${id}/report`,
    PLANS: '/owner-plans',
    SETTLEMENT: '/owner-settlement',
    PARTNERS: '/partners',
  },

  // Site Owner
  SITE_OWNER: {
    SITES: '/sites',
    SITE_DETAIL: (id: string) => `/sites/${id}`,
    MY_SITES: '/site-owner-sites',
    DASHBOARD: '/site-owner-dashboard',
    PARKING: '/parking',
    TENANTS: '/tenants',
  },

  // Technician
  TECH: {
    JOBS: '/jobs',
    TECH_JOBS: '/technician-jobs',
    AVAILABILITY: '/technician-availability',
    SETTLEMENTS: '/technician-settlements',
    DOCS: '/technician-docs',
  },

  // Operator
  OPERATOR: {
    OPS: '/operator-ops',
    KIOSK: '/kiosk-scan',
    RESERVE: '/manual-reserve',
    ASSIGNMENTS: '/operator-assignments',
    AVAILABILITY: '/operator-availability',
    DASHBOARD: '/operator-dashboard',
    JOBS: '/operator-jobs',
    REPORTS: '/operator-reports',
    SWAP_DETAIL: (id: string) => `/swap-stations/${id}`,
    TEAM_DETAIL: (id: string) => `/team/${id}`,
  },

  // Misc
  SETTING: '/settings',
  WALLET: '/wallet',
  MARKETPLACE: '/marketplace',
  EXPLORE: '/explore',
  ONBOARDING: '/onboarding',
  HELP: '/help',
  CONTENT: '/content',
  OPENADR: '/openadr',
  ROAMING: '/roaming',
  REGULATORY: '/regulatory',
  UTILITY: '/utility',
  LEGAL: {
    TERMS: '/legal-terms',
    PRIVACY: '/legal-privacy',
    COOKIES: '/legal-cookies',
  },
  ERRORS: {
    UNAUTHORIZED: '/unauthorized',
    NOT_FOUND: '/404',
    SERVER_ERROR: '/500',
    OFFLINE: '/offline',
    BROWSER: '/browser-unsupported',
  },
} as const
