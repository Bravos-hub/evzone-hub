import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './guards'
import { LoginPage } from '@/pages/auth/LoginPage'
import { UnauthorizedPage } from '@/pages/errors/UnauthorizedPage'
import { HomeRouter } from '@/pages/landing/HomeRouter'
import { PlaceholderPage } from '@/pages/errors/PlaceholderPage'
import { PATHS } from './paths'

// Generic Dashboard (RBAC-controlled widget system)
import { GenericDashboard } from '@/ui/dashboard'

// Unified Feature Pages (role-agnostic, RBAC handled internally)
import {
    // Core Features
    Stations,
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
    Settlement,
    Plans,
    FeatureFlags,
    WebhooksLog,

    // Owner Features
    Tariffs,
    ChargePoints,
    SwapStations,
    SmartCharging,
    Earnings,
    Bookings,
    // Site Owner Features
    Sites,
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
    Explore,
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
    // Role-specific Ops

    TechnicianAvailability,
    SiteOwnerSites,
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
    OperatorSwapStationDetail,
    OperatorTeamDetail,
    OwnerOperatorsReport,
    ManualReserve,
    OperatorAssignments,
    OperatorAvailability,
    SiteDetail,
} from '@/features'

/**
 * Application Routes - Unified flat structure
 * 
 * All routes use RequireAuth (must be logged in).
 * Role-based access control is handled INSIDE each feature component.
 * The sidebar dynamically shows/hides menu items based on role.
 */
export function AppRoutes() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path={PATHS.HOME} element={<HomeRouter />} />
            <Route path={PATHS.AUTH.LOGIN} element={<LoginPage />} />
            <Route path={PATHS.ERRORS.UNAUTHORIZED} element={<UnauthorizedPage />} />

            {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD - Single route, content determined by user's role
          ═══════════════════════════════════════════════════════════════════════ */}
            <Route path={PATHS.DASHBOARD} element={<RequireAuth><GenericDashboard /></RequireAuth>} />

            {/* ═══════════════════════════════════════════════════════════════════════
          CORE FEATURES - Available to multiple roles (RBAC inside component)
          ═══════════════════════════════════════════════════════════════════════ */}
            <Route path={PATHS.STATIONS.ROOT} element={<RequireAuth><Stations /></RequireAuth>} />
            <Route path={PATHS.STATIONS.CHARGE_POINTS} element={<RequireAuth><Stations /></RequireAuth>} />
            <Route path={PATHS.STATIONS.SWAP_STATIONS} element={<RequireAuth><Stations /></RequireAuth>} />
            <Route path={PATHS.STATIONS.SMART_CHARGING} element={<RequireAuth><Stations /></RequireAuth>} />
            <Route path={PATHS.STATIONS.BOOKINGS} element={<RequireAuth><Stations /></RequireAuth>} />

            {/* Redirect old routes to stations sub-routes */}
            <Route path="/charge-points" element={<Navigate to={PATHS.STATIONS.CHARGE_POINTS} replace />} />
            <Route path="/swap-stations" element={<Navigate to={PATHS.STATIONS.SWAP_STATIONS} replace />} />
            <Route path="/smart-charging" element={<Navigate to={PATHS.STATIONS.SMART_CHARGING} replace />} />
            <Route path="/bookings" element={<Navigate to={PATHS.STATIONS.BOOKINGS} replace />} />

            <Route path={PATHS.SESSIONS} element={<RequireAuth><Sessions /></RequireAuth>} />
            <Route path={PATHS.INCIDENTS} element={<RequireAuth><Incidents /></RequireAuth>} />
            <Route path={PATHS.DISPATCHES} element={<RequireAuth><Dispatches /></RequireAuth>} />
            <Route path={PATHS.BILLING} element={<RequireAuth><Billing /></RequireAuth>} />
            <Route path={PATHS.REPORTS} element={<RequireAuth><Reports /></RequireAuth>} />
            <Route path={PATHS.TEAM} element={<RequireAuth><Team /></RequireAuth>} />
            <Route path={PATHS.NOTIFICATIONS} element={<RequireAuth><Notifications /></RequireAuth>} />

            {/* ═══════════════════════════════════════════════════════════════════════
          ADMIN FEATURES - RBAC checked inside each component
          ═══════════════════════════════════════════════════════════════════════ */}
            <Route path={PATHS.ADMIN.USERS} element={<RequireAuth><Users /></RequireAuth>} />
            <Route path={PATHS.ADMIN.USER_DETAIL(':userId')} element={<RequireAuth><UserDetail /></RequireAuth>} />
            <Route path={PATHS.ADMIN.APPROVALS} element={<RequireAuth><Approvals /></RequireAuth>} />
            <Route path={PATHS.ADMIN.AUDIT_LOGS} element={<RequireAuth><AuditLogs /></RequireAuth>} />
            <Route path={PATHS.ADMIN.SYSTEM_HEALTH} element={<RequireAuth><SystemHealth /></RequireAuth>} />
            <Route path={PATHS.ADMIN.GLOBAL_CONFIG} element={<RequireAuth><GlobalConfig /></RequireAuth>} />
            <Route path={PATHS.ADMIN.INTEGRATIONS} element={<RequireAuth><Integrations /></RequireAuth>} />
            <Route path={PATHS.ADMIN.KYC} element={<RequireAuth><KycCompliance /></RequireAuth>} />
            <Route path={PATHS.ADMIN.DISPUTES} element={<RequireAuth><Disputes /></RequireAuth>} />
            <Route path={PATHS.ADMIN.BROADCASTS} element={<RequireAuth><Broadcasts /></RequireAuth>} />
            <Route path={PATHS.ADMIN.PROTOCOLS} element={<RequireAuth><Protocols /></RequireAuth>} />
            <Route path={PATHS.ADMIN.SETTLEMENT} element={<RequireAuth><Settlement /></RequireAuth>} />
            <Route path={PATHS.ADMIN.PLANS} element={<RequireAuth><Plans /></RequireAuth>} />
            <Route path={PATHS.ADMIN.FEATURE_FLAGS} element={<RequireAuth><FeatureFlags /></RequireAuth>} />
            <Route path={PATHS.ADMIN.WEBHOOKS_LOG} element={<RequireAuth><WebhooksLog /></RequireAuth>} />
            <Route path={PATHS.ADMIN.WEBHOOKS} element={<RequireAuth><Webhooks /></RequireAuth>} />
            <Route path={PATHS.ADMIN.SUPPORT} element={<RequireAuth><SupportDesk /></RequireAuth>} />
            <Route path={PATHS.ADMIN.PRIVACY} element={<RequireAuth><PrivacyRequests /></RequireAuth>} />
            <Route path={PATHS.ADMIN.CRM} element={<RequireAuth><CRM /></RequireAuth>} />
            <Route path={PATHS.ADMIN.STATUS} element={<RequireAuth><StatusPage /></RequireAuth>} />
            <Route path={PATHS.ADMIN.ROLES} element={<RequireAuth><RolesMatrix /></RequireAuth>} />
            <Route path={PATHS.ADMIN.ORGS} element={<RequireAuth><Organizations /></RequireAuth>} />
            <Route path={PATHS.ADMIN.HOME} element={<Navigate to={PATHS.DASHBOARD} replace />} />

            <Route path={PATHS.MARKETPLACE} element={<RequireAuth><Marketplace /></RequireAuth>} />
            <Route path={PATHS.EXPLORE} element={<RequireAuth><Explore /></RequireAuth>} />
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
            <Route path={PATHS.OWNER.TARIFFS} element={<RequireAuth><Tariffs /></RequireAuth>} />
            <Route path={PATHS.OWNER.EARNINGS} element={<RequireAuth><Earnings /></RequireAuth>} />
            <Route path={PATHS.OWNER.BOOKING_LEDGER} element={<RequireAuth><BookingLedger /></RequireAuth>} />
            <Route path={PATHS.OWNER.PRICING_RECIPES} element={<RequireAuth><PricingRecipes /></RequireAuth>} />
            <Route path={PATHS.OWNER.LOAD_POLICY} element={<RequireAuth><LoadPolicy /></RequireAuth>} />

            {/* ═══════════════════════════════════════════════════════════════════════
          SITE OWNER FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
            <Route path={PATHS.SITE_OWNER.SITES} element={<RequireAuth><Sites /></RequireAuth>} />
            <Route path={PATHS.SITE_OWNER.SITE_DETAIL(':id')} element={<RequireAuth><SiteDetail /></RequireAuth>} />

            {/* ═══════════════════════════════════════════════════════════════════════
          TECHNICIAN FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
            <Route path={PATHS.TECH.JOBS} element={<RequireAuth><Jobs /></RequireAuth>} />
            <Route path={PATHS.TECH.TECH_JOBS} element={<RequireAuth><TechnicianJobs /></RequireAuth>} />
            <Route path={PATHS.TECH.AVAILABILITY} element={<RequireAuth><TechnicianAvailability /></RequireAuth>} />

            {/* ═══════════════════════════════════════════════════════════════════════
          NEW PORTED FEATURES
          ═══════════════════════════════════════════════════════════════════════ */}
            {/* Admin Advanced */}
            <Route path={PATHS.ADMIN.WEBHOOKS} element={<RequireAuth><Webhooks /></RequireAuth>} />
            {/* Note: some paths might overlap or be duplicated in routes.tsx, I'll follow the existing structure */}
            <Route path="/content" element={<RequireAuth><Content /></RequireAuth>} />
            <Route path="/openadr" element={<RequireAuth><OpenADR /></RequireAuth>} />
            <Route path="/roaming" element={<RequireAuth><Roaming /></RequireAuth>} />
            <Route path="/regulatory" element={<RequireAuth><Regulatory /></RequireAuth>} />
            <Route path="/utility" element={<RequireAuth><Utility /></RequireAuth>} />
            <Route path={PATHS.OWNER.OPS} element={<Navigate to={PATHS.SESSIONS} replace />} />

            {/* Settings & Wallet */}
            <Route path={PATHS.SETTING} element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path={PATHS.WALLET} element={<RequireAuth><Wallet /></RequireAuth>} />

            {/* Owner Tools */}
            <Route path={PATHS.OWNER.TECH_REQUESTS} element={<RequireAuth><TechRequests /></RequireAuth>} />
            <Route path={PATHS.OWNER.ADD_CHARGER} element={<RequireAuth><AddCharger /></RequireAuth>} />


            {/* Operator Tools */}
            <Route path={PATHS.OPERATOR.OPS} element={<Navigate to={PATHS.INCIDENTS} replace />} />
            <Route path={PATHS.OPERATOR.KIOSK} element={<RequireAuth><KioskScan /></RequireAuth>} />
            <Route path={PATHS.OPERATOR.RESERVE} element={<RequireAuth><ManualReserve /></RequireAuth>} />
            <Route path={PATHS.OPERATOR.ASSIGNMENTS} element={<RequireAuth><OperatorAssignments /></RequireAuth>} />
            <Route path={PATHS.OPERATOR.AVAILABILITY} element={<RequireAuth><OperatorAvailability /></RequireAuth>} />
            <Route path={PATHS.OPERATOR.SWAP_DETAIL(':id')} element={<RequireAuth><OperatorSwapStationDetail /></RequireAuth>} />
            <Route path={PATHS.OPERATOR.TEAM_DETAIL(':id')} element={<RequireAuth><OperatorTeamDetail /></RequireAuth>} />

            {/* Site Owner Tools */}
            <Route path={PATHS.SITE_OWNER.MY_SITES} element={<RequireAuth><SiteOwnerSites /></RequireAuth>} />
            <Route path={PATHS.SITE_OWNER.DASHBOARD} element={<Navigate to={PATHS.DASHBOARD} replace />} />
            <Route path={PATHS.SITE_OWNER.PARKING} element={<RequireAuth><Parking /></RequireAuth>} />
            <Route path={PATHS.SITE_OWNER.TENANTS} element={<RequireAuth><Tenants /></RequireAuth>} />

            {/* Operator Tools */}
            <Route path={PATHS.OPERATOR.DASHBOARD} element={<Navigate to={PATHS.DASHBOARD} replace />} />

            {/* Financial Tools */}
            <Route path={PATHS.SESSIONS} element={<RequireAuth><Sessions /></RequireAuth>} />
            {/* Note: routes.tsx has some repetitive entries, I'll keep them to maintain existing behavior but use constants */}
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
            <Route path={PATHS.AUTH.LOGIN} element={<Login />} />
            <Route path={PATHS.AUTH.REGISTER} element={<Register />} />
            <Route path={PATHS.AUTH.FORGOT_PASSWORD} element={<ForgotPassword />} />
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
