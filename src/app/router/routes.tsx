import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RequirePermission, RequireRole } from './guards'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { UnauthorizedPage } from '@/pages/errors/UnauthorizedPage'
import { HomeRouter } from '@/pages/landing/HomeRouter'
import { PlaceholderPage } from '@/pages/errors/PlaceholderPage'
import { SessionDetailPage } from '@/pages/sessions/SessionDetailPage'
import { InvoiceDetailPage } from '@/pages/billing/InvoiceDetailPage'
import { PATHS } from './paths'

import { GenericDashboard } from '@/ui/dashboard'
import { capabilityAllowsCharge } from '@/core/auth/rbac'
import { useAuthStore } from '@/core/auth/authStore'
import type { UserProfile } from '@/core/auth/types'
import type { PermissionFeature } from '@/constants/permissions'

// Unified Feature Pages (role-agnostic, RBAC handled internally)
import {
  // Core Features
  Stations,
  StationDetail,
  SwapProviders,
  ProviderPortal,
  SwapStations,
  Sessions,
  Incidents,
  Dispatches,
  Billing,
  Reports,
  Team,
  Notifications,
  // Admin Features
  Users,
  UserDetail,
  Approvals,
  AuditLogs,
  SystemHealth,
  GlobalConfig,
  Integrations,
  KycCompliance,
  Disputes,
  Broadcasts,
  Protocols,
  Webhooks,
  SupportDesk,
  PrivacyRequests,
  CRM,
  StatusPage,
  RolesMatrix,
  Organizations,
  Geography,
  Settlement,
  Plans,
  FeatureFlags,
  WebhooksLog,

  // Owner Features
  Tariffs,
  SmartCharging,
  Earnings,
  Bookings,
  // Site Owner Features

  TenantDetail,
  SiteOwnerWithdrawals,
  SiteApplicationDetail,
  // Technician Features
  Jobs,
  // New Ported Features
  Content,
  OpenADR,
  Roaming,
  Regulatory,
  Utility,
  Partners,
  Onboarding,
  Settings,
  Wallet,
  TechRequests,
  AddCharger,
  TechnicianJobs,
  // Marketplace & Explore
  Marketplace,
  // Explore, // Component doesn't exist
  // Help & Legal
  Help,
  LegalTerms,
  LegalPrivacy,
  LegalCookies,
  // Error Pages
  NotFound,
  ServerError,
  Offline,
  BrowserUnsupported,
  // Auth Pages
  Login,
  Register,
  ForgotPassword,
  VerifyEmail,
  InvitationAcceptPage,
  SelectOrganizationPage,
  ForcePasswordChangePage,
  AccountPending,
  // Role-specific Ops

  TechnicianAvailability,
  // Additional Ported Features
  Alerts,
  Payments,
  Payouts,
  Parking,
  Tenants,
  Discounts,
  StationMap,
  OwnerAlerts,
  Operators,
  OwnerPlans,
  OwnerSettlement,
  OperatorJobs,
  OperatorReports,
  TechnicianSettlements,
  TechnicianDocs,
  BookingLedger,
  PricingRecipes,
  LoadPolicy,
  KioskScan,
  SwapStationDetail,
  OperatorTeamDetail,
  OwnerOperatorsReport,
  ManualReserve,
  OperatorAssignments,
  OperatorAvailability,

  ChargePointDetail,
  SiteApplicationForm,
  AddSite,
  AddStationEntry,
  AddStation,
  AddSwapStation,
  OwnerIncidentCenter,
  ApplicationTracker,
  LeaseCompliance,
  AdvancedReporting,
  StationOperatorAssignment,
  OperatorRoleManagement,
  PendingApplications,
} from '@/features'
import { Sites } from '@/modules/sites/components/Sites'
import { SiteDetail } from '@/modules/sites/components/SiteDetail'

/**
 * Application Routes - Unified flat structure
 *
 * Authentication is enforced with RequireAuth.
 * Top-level feature access is enforced with RequirePermission where the
 * permission mapping is already defined.
 * Sidebar visibility is a narrower audience layer on top of permissions.
 */
export function IncidentsRouter() {
  const { user } = useAuthStore()
  if (user?.role === 'STATION_OWNER') return <OwnerIncidentCenter />
  return <Incidents />
}

export function ReportsRouter() {
  const { user } = useAuthStore()
  if (user?.role === 'STATION_OWNER') return <AdvancedReporting />
  return <Reports />
}

type PermissionRouteOptions = {
  permission?: string
  when?: (user: UserProfile) => boolean
}

const withPermission = (
  feature: PermissionFeature,
  element: ReactNode,
  options: PermissionRouteOptions = {},
) => (
  <RequireAuth>
    <RequirePermission feature={feature} permission={options.permission} when={options.when}>
      {element}
    </RequirePermission>
  </RequireAuth>
)

const chargeCapableOwnerTools = (user: UserProfile) =>
  !['STATION_OWNER', 'STATION_OPERATOR'].includes(user.role) || capabilityAllowsCharge(user.ownerCapability)

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={PATHS.HOME} element={<HomeRouter />} />
      <Route path={PATHS.AUTH.LOGIN} element={<Login />} />
      <Route path={PATHS.AUTH.INVITATION_ACCEPT} element={<InvitationAcceptPage />} />
      <Route path={PATHS.AUTH.AWAITING_APPROVAL} element={<AccountPending />} />
      <Route path="/login" element={<Navigate to={PATHS.AUTH.LOGIN} replace />} />
      <Route path={PATHS.ERRORS.UNAUTHORIZED} element={<UnauthorizedPage />} />
      <Route
        path={PATHS.AUTH.SELECT_ORGANIZATION}
        element={
          <RequireAuth>
            <SelectOrganizationPage />
          </RequireAuth>
        }
      />
      <Route
        path={PATHS.AUTH.FORCE_PASSWORD_CHANGE}
        element={
          <RequireAuth>
            <ForcePasswordChangePage />
          </RequireAuth>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD - Single route, content determined by user's role
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.DASHBOARD} element={withPermission('dashboard', <GenericDashboard />)} />

      {/* ═══════════════════════════════════════════════════════════════════════
          CORE FEATURES - Available to multiple roles (RBAC inside component)
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.STATIONS.ROOT} element={withPermission('stations', <Stations />)} />
      <Route path="/stations/:id" element={withPermission('stations', <StationDetail />)} />
      <Route path={PATHS.STATIONS.CHARGE_POINTS} element={withPermission('charge-points', <Stations />, { when: chargeCapableOwnerTools })} />
      <Route path="/stations/charge-points/:id" element={withPermission('charge-points', <ChargePointDetail />, { when: chargeCapableOwnerTools })} />
      <Route path={PATHS.STATIONS.SWAP_STATIONS} element={withPermission('swapStations', <Stations />)} />
      <Route path={PATHS.STATIONS.SMART_CHARGING} element={withPermission('smartCharging', <Stations />, { when: chargeCapableOwnerTools })} />
      <Route path={PATHS.STATIONS.BOOKINGS} element={withPermission('bookings', <Stations />)} />
      <Route path={PATHS.STATIONS.ASSIGN_OPERATOR(':id')} element={withPermission('stations', <StationOperatorAssignment />)} />

      {/* Redirect old routes to stations sub-routes */}
      <Route path="/charge-points" element={<Navigate to={PATHS.STATIONS.CHARGE_POINTS} replace />} />
      <Route path="/swap-stations" element={<Navigate to={PATHS.STATIONS.SWAP_STATIONS} replace />} />
      <Route path="/smart-charging" element={<Navigate to={PATHS.STATIONS.SMART_CHARGING} replace />} />
      <Route path="/bookings" element={<Navigate to={PATHS.STATIONS.BOOKINGS} replace />} />

      <Route path={PATHS.SESSIONS} element={withPermission('sessions', <Sessions />)} />
      <Route path="/sessions/:id" element={withPermission('sessions', <SessionDetailPage />)} />
      <Route path={PATHS.INCIDENTS} element={withPermission('incidents', <IncidentsRouter />)} />
      <Route path={PATHS.DISPATCHES} element={withPermission('dispatches', <Dispatches />)} />
      <Route path={PATHS.BILLING} element={withPermission('billing', <Billing />)} />
      <Route path="/billing/invoices/:id" element={withPermission('billing', <InvoiceDetailPage />)} />
      <Route path={PATHS.REPORTS} element={withPermission('reports', <ReportsRouter />)} />
      <Route path={PATHS.TEAM} element={withPermission('team', <Team />)} />
      <Route path={PATHS.NOTIFICATIONS} element={withPermission('notifications', <Notifications />)} />

      {/* ═══════════════════════════════════════════════════════════════════════
          ADMIN FEATURES - RBAC checked inside each component
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.ADMIN.USERS} element={withPermission('users', <Users />)} />
      <Route path={PATHS.ADMIN.USER_DETAIL(':userId')} element={withPermission('users', <UserDetail />)} />
      <Route path={PATHS.ADMIN.APPROVALS} element={withPermission('approvals', <PendingApplications />)} />
      <Route path={PATHS.ADMIN.AUDIT_LOGS} element={withPermission('auditLogs', <AuditLogs />)} />
      <Route path={PATHS.ADMIN.SYSTEM_HEALTH} element={withPermission('systemHealth', <SystemHealth />)} />
      <Route path={PATHS.ADMIN.GLOBAL_CONFIG} element={withPermission('globalConfig', <GlobalConfig />)} />
      <Route path={PATHS.ADMIN.INTEGRATIONS} element={withPermission('integrations', <Integrations />)} />
      <Route path={PATHS.ADMIN.KYC} element={withPermission('kycCompliance', <KycCompliance />)} />
      <Route path={PATHS.ADMIN.DISPUTES} element={withPermission('disputes', <Disputes />)} />
      <Route path={PATHS.ADMIN.BROADCASTS} element={withPermission('broadcasts', <Broadcasts />)} />
      <Route path={PATHS.ADMIN.PROTOCOLS} element={withPermission('protocols', <Protocols />)} />
      <Route path={PATHS.ADMIN.SETTLEMENT} element={withPermission('settlement', <Settlement />)} />
      <Route path={PATHS.ADMIN.PLANS} element={withPermission('plans', <Plans />)} />
      <Route path={PATHS.ADMIN.FEATURE_FLAGS} element={withPermission('featureFlags', <FeatureFlags />)} />
      <Route path={PATHS.ADMIN.WEBHOOKS_LOG} element={withPermission('webhooksLog', <WebhooksLog />)} />
      <Route path={PATHS.ADMIN.WEBHOOKS} element={withPermission('webhooks', <Webhooks />)} />
      <Route path={PATHS.ADMIN.SUPPORT} element={withPermission('supportDesk', <SupportDesk />)} />
      <Route path={PATHS.ADMIN.PRIVACY} element={withPermission('privacyRequests', <PrivacyRequests />)} />
      <Route path={PATHS.ADMIN.CRM} element={withPermission('crm', <CRM />)} />
      <Route path={PATHS.ADMIN.STATUS} element={withPermission('statusPage', <StatusPage />)} />
      <Route path={PATHS.ADMIN.ROLES} element={withPermission('rolesMatrix', <RolesMatrix />)} />
      <Route path={PATHS.ADMIN.ORGS} element={withPermission('organizations', <Organizations />)} />
      <Route path={PATHS.ADMIN.GEOGRAPHY} element={withPermission('geography', <Geography />)} />
      <Route path={PATHS.ADMIN.HOME} element={<Navigate to={PATHS.DASHBOARD} replace />} />

      <Route path={PATHS.MARKETPLACE} element={<RequireAuth><Marketplace /></RequireAuth>} />
      <Route path={PATHS.EXPLORE} element={<Navigate to={PATHS.MARKETPLACE} replace />} />
      <Route path={PATHS.HELP} element={<RequireAuth><Help /></RequireAuth>} />
      <Route path={PATHS.LEGAL.TERMS} element={<RequireAuth><LegalTerms /></RequireAuth>} />
      <Route path={PATHS.LEGAL.PRIVACY} element={<RequireAuth><LegalPrivacy /></RequireAuth>} />
      <Route path={PATHS.LEGAL.COOKIES} element={<RequireAuth><LegalCookies /></RequireAuth>} />

      {/* Legacy dashboard routes - redirect to unified dashboard */}
      <Route path="/owner/dashboard/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/manager/dashboard" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/attendant/dashboard" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/technician/dashboard/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />

      {/* ═══════════════════════════════════════════════════════════════════════
          OWNER FEATURES - RBAC checked inside each component
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.OWNER.TARIFFS} element={withPermission('tariffs', <Tariffs />, { when: chargeCapableOwnerTools })} />
      <Route path={PATHS.OWNER.PROVIDERS} element={withPermission('swapProviders', <SwapProviders />)} />
      <Route path={PATHS.PROVIDER.DASHBOARD} element={withPermission('providerPortal', <ProviderPortal />)} />
      <Route path={PATHS.OWNER.EARNINGS} element={withPermission('earnings', <Earnings />)} />
      <Route path={PATHS.OWNER.BOOKING_LEDGER} element={withPermission('bookings', <BookingLedger />)} />
      <Route path={PATHS.OWNER.PRICING_RECIPES} element={<RequireAuth><PricingRecipes /></RequireAuth>} />
      <Route path={PATHS.OWNER.LOAD_POLICY} element={<RequireAuth><LoadPolicy /></RequireAuth>} />

      {/* Station Owner (Tenant) Dashboard */}
      <Route path={PATHS.TENANT.DASHBOARD} element={withPermission('sites', <Sites />)} />

      {/* ═══════════════════════════════════════════════════════════════════════
          SITE OWNER FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.SITE_OWNER.SITES} element={withPermission('sites', <Sites />)} />
      <Route path={PATHS.SITE_OWNER.SITE_DETAIL(':id')} element={withPermission('sites', <SiteDetail />)} />

      {/* ═══════════════════════════════════════════════════════════════════════
          TECHNICIAN FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.TECH.JOBS} element={withPermission('jobs', <Jobs />)} />
      <Route path={PATHS.TECH.TECH_JOBS} element={withPermission('technicianJobs', <TechnicianJobs />)} />
      <Route path={PATHS.TECH.AVAILABILITY} element={withPermission('technicianAvailability', <TechnicianAvailability />)} />

      {/* ═══════════════════════════════════════════════════════════════════════
          NEW PORTED FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
      {/* Admin Advanced */}
      <Route path="/content" element={withPermission('content', <Content />)} />
      <Route path="/openadr" element={withPermission('openadr', <OpenADR />)} />
      <Route path="/roaming" element={withPermission('roaming', <Roaming />)} />
      <Route path="/regulatory" element={withPermission('regulatory', <Regulatory />)} />
      <Route path="/utility" element={withPermission('utility', <Utility />)} />
      <Route path={PATHS.OWNER.OPS} element={<Navigate to={PATHS.SESSIONS} replace />} />

      {/* Settings & Wallet */}
      <Route path={PATHS.SETTING} element={withPermission('settings', <Settings />)} />
      <Route path={PATHS.WALLET} element={withPermission('wallet', <Wallet />)} />

      {/* Owner Tools */}
      <Route path={PATHS.OWNER.TECH_REQUESTS} element={withPermission('techRequests', <TechRequests />)} />
      <Route path={PATHS.OWNER.ADD_STATION_ENTRY} element={withPermission('stations', <AddStationEntry />)} />
      <Route path={PATHS.OWNER.ADD_CHARGE_STATION} element={withPermission('stations', <AddStation />, { when: chargeCapableOwnerTools })} />
      <Route path={PATHS.OWNER.ADD_CHARGER} element={withPermission('addCharger', <AddCharger />, { when: chargeCapableOwnerTools })} />
      <Route path={PATHS.OWNER.ADD_SWAP_STATION} element={withPermission('swapStations', <AddSwapStation />)} />
      <Route path="/add-station/swap" element={<Navigate to={PATHS.OWNER.ADD_SWAP_STATION} replace />} />
      <Route
        path={PATHS.OWNER.EXPANSION_TRACKER}
        element={(
          <RequireAuth>
            <RequireRole roles={['STATION_OWNER', 'STATION_ADMIN']}>
              <ApplicationTracker />
            </RequireRole>
          </RequireAuth>
        )}
      />
      <Route
        path={PATHS.OWNER.LEASE_COMPLIANCE}
        element={(
          <RequireAuth>
            <RequireRole roles={['STATION_OWNER', 'STATION_ADMIN']}>
              <LeaseCompliance />
            </RequireRole>
          </RequireAuth>
        )}
      />


      {/* Operator Tools */}
      <Route path={PATHS.OPERATOR.OPS} element={<Navigate to={PATHS.INCIDENTS} replace />} />
      <Route path={PATHS.OPERATOR.KIOSK} element={<RequireAuth><KioskScan /></RequireAuth>} />
      <Route path={PATHS.OPERATOR.RESERVE} element={<RequireAuth><ManualReserve /></RequireAuth>} />
      <Route path={PATHS.OPERATOR.ASSIGNMENTS} element={<RequireAuth><OperatorAssignments /></RequireAuth>} />
      <Route path={PATHS.OPERATOR.AVAILABILITY} element={<RequireAuth><OperatorAvailability /></RequireAuth>} />
      <Route path={PATHS.OPERATOR.SWAP_DETAIL(':id')} element={<RequireAuth><SwapStationDetail /></RequireAuth>} />
      <Route path={PATHS.OPERATOR.TEAM_DETAIL(':id')} element={<RequireAuth><OperatorTeamDetail /></RequireAuth>} />
      <Route path={PATHS.OPERATOR.CUSTOM_ROLES} element={<RequireAuth><OperatorRoleManagement /></RequireAuth>} />

      {/* Site Owner Tools */}
      <Route path={PATHS.SITE_OWNER.MY_SITES} element={withPermission('sites', <Sites />)} />
      <Route path={PATHS.SITE_OWNER.DASHBOARD} element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path={PATHS.SITE_OWNER.PARKING} element={withPermission('parking', <Parking />)} />
      <Route path={PATHS.SITE_OWNER.TENANTS} element={withPermission('tenants', <Tenants />)} />
      <Route path={PATHS.SITE_OWNER.TENANT_DETAIL(':id')} element={withPermission('tenants', <TenantDetail />)} />
      <Route path={PATHS.SITE_OWNER.WITHDRAWALS} element={<RequireAuth><SiteOwnerWithdrawals /></RequireAuth>} />
      <Route path={PATHS.SITE_OWNER.APPLY_FOR_SITE} element={<RequireAuth><SiteApplicationForm /></RequireAuth>} />
      <Route path={PATHS.SITE_OWNER.ADD_SITE} element={<RequireAuth><AddSite /></RequireAuth>} />
      <Route path={PATHS.SITE_OWNER.APPLICATION_DETAIL(':id')} element={<RequireAuth><SiteApplicationDetail /></RequireAuth>} />

      {/* Operator Tools */}
      <Route path={PATHS.OPERATOR.DASHBOARD} element={<Navigate to={PATHS.DASHBOARD} replace />} />

      {/* Financial Tools */}
      <Route path="/payments" element={<RequireAuth><Payments /></RequireAuth>} />
      <Route path="/payouts" element={<RequireAuth><Payouts /></RequireAuth>} />

      {/* Platform Monitoring */}
      <Route path="/alerts" element={<RequireAuth><Alerts /></RequireAuth>} />

      {/* Owner Features */}
      <Route path={PATHS.OWNER.DISCOUNTS} element={<RequireAuth><Discounts /></RequireAuth>} />
      <Route path={PATHS.OWNER.STATION_MAP} element={<RequireAuth><StationMap /></RequireAuth>} />
      <Route path={PATHS.OWNER.ALERTS} element={<RequireAuth><OwnerAlerts /></RequireAuth>} />
      <Route path={PATHS.OWNER.OPERATORS} element={<RequireAuth><Operators /></RequireAuth>} />
      <Route path={PATHS.OWNER.OPERATOR_REPORT(':id')} element={<RequireAuth><OwnerOperatorsReport /></RequireAuth>} />
      <Route path={PATHS.OWNER.PLANS} element={<RequireAuth><OwnerPlans /></RequireAuth>} />
      <Route path={PATHS.OWNER.SETTLEMENT} element={<RequireAuth><OwnerSettlement /></RequireAuth>} />

      {/* Operator Features */}
      <Route path={PATHS.OPERATOR.JOBS} element={<RequireAuth><OperatorJobs /></RequireAuth>} />
      <Route path={PATHS.OPERATOR.REPORTS} element={<RequireAuth><OperatorReports /></RequireAuth>} />

      {/* Technician Features */}
      <Route path={PATHS.TECH.SETTLEMENTS} element={<RequireAuth><TechnicianSettlements /></RequireAuth>} />
      <Route path={PATHS.TECH.DOCS} element={<RequireAuth><TechnicianDocs /></RequireAuth>} />

      {/* ═══════════════════════════════════════════════════════════════════════
          PUBLIC ROUTES (No auth required)
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.ONBOARDING} element={<Onboarding />} />
      {/* Login route is already defined above */}
      <Route path={PATHS.AUTH.REGISTER} element={<Register />} />
      <Route path="/register" element={<Navigate to={PATHS.AUTH.REGISTER} replace />} />
      <Route path={PATHS.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={PATHS.AUTH.RESET_PASSWORD} element={<ResetPasswordPage />} />
      <Route path={PATHS.AUTH.VERIFY_EMAIL} element={<VerifyEmail />} />

      {/* ═══════════════════════════════════════════════════════════════════════
          ERROR PAGES
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path={PATHS.ERRORS.NOT_FOUND} element={<NotFound />} />
      <Route path={PATHS.ERRORS.SERVER_ERROR} element={<ServerError />} />
      <Route path={PATHS.ERRORS.OFFLINE} element={<Offline />} />
      <Route path={PATHS.ERRORS.BROWSER} element={<BrowserUnsupported />} />

      {/* ═══════════════════════════════════════════════════════════════════════
          LEGACY ROUTES - Redirect to new structure
          ═══════════════════════════════════════════════════════════════════════ */}
      <Route path="/admin" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/admin/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/operator" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/operator/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/provider/*" element={<Navigate to={PATHS.PROVIDER.DASHBOARD} replace />} />
      <Route path="/owner/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/site-owner/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/station-admin/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/manager/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/attendant/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />
      <Route path="/technician/*" element={<Navigate to={PATHS.DASHBOARD} replace />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={PATHS.HOME} replace />} />
    </Routes>
  )
}

