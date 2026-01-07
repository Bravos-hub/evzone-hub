// ═══════════════════════════════════════════════════════════════════════════
// FEATURE EXPORTS - All role-agnostic feature components
// ═══════════════════════════════════════════════════════════════════════════

// Core Features (Multiple roles)
export { Stations } from './Stations'
export { Sessions } from './Sessions'
export { Incidents } from './Incidents'
export { Dispatches } from './Dispatches'
export { Billing } from './Billing'
export { Reports } from './Reports'
export { Team } from './Team'
export { Notifications } from './Notifications'

// Admin Features
export { Users } from './Users'
export { UserDetail } from './UserDetail'
export { Approvals } from './Approvals'
export { AuditLogs } from './AuditLogs'
export { SystemHealth } from './SystemHealth'
export { GlobalConfig } from './GlobalConfig'
export { Integrations } from './Integrations'
export { KycCompliance } from './KycCompliance'
export { Disputes } from './Disputes'
export { Broadcasts } from './Broadcasts'
export { Protocols } from './Protocols'
export { Webhooks } from './Webhooks'
export { SupportDesk } from './SupportDesk'
export { PrivacyRequests } from './PrivacyRequests'
export { CRM } from './CRM'
export { StatusPage } from './StatusPage'

// Owner Features
export { Tariffs } from './Tariffs'
export { ChargePoints } from './ChargePoints'
export { SwapStations } from './SwapStations'
export { SmartCharging } from './SmartCharging'
export { Earnings } from './Earnings'
export { Bookings } from './Bookings'

// Site Owner Features
export { Sites } from './Sites'
export { SiteDetail } from './SiteDetail'
export { AddSite } from './AddSite'
export { OwnerSteps } from './onboarding/OwnerSteps'
export { OperatorSteps } from './onboarding/OperatorSteps'
export { TechnicianSteps } from './onboarding/TechnicianSteps'

// Technician Features
export { Jobs } from './Jobs'

// ═══════════════════════════════════════════════════════════════════════════
// NEW PORTED FEATURES (from legacy codebase)
// ═══════════════════════════════════════════════════════════════════════════

// Admin Advanced Features
export { Content } from './Content'
export { OpenADR } from './OpenADR'
export { Roaming } from './Roaming'
export { Regulatory } from './Regulatory'
export { Utility } from './Utility'
export { RolesMatrix } from './RolesMatrix'
export { Organizations } from './Organizations'
export { Settlement } from './Settlement'
export { Plans } from './Plans'
export { FeatureFlags } from './FeatureFlags'
export { WebhooksLog } from './WebhooksLog'


// Marketplace & Explore
export { Marketplace } from './Marketplace'
export { Explore } from './Explore'

// Help & Legal
export { Help, LegalTerms, LegalPrivacy, LegalCookies } from './HelpLegal'

// Onboarding
export { Onboarding } from './Onboarding'

// Settings
export { Settings } from './Settings'

// Partners
export { Partners } from './Partners'

// Wallet
export { Wallet } from './Wallet'

// Tech Requests (Owner side)
export { TechRequests } from './TechRequests'

// Add Charger Wizard
export { AddCharger } from './AddCharger'

// Technician Jobs (detailed)
export { TechnicianJobs } from './TechnicianJobs'

// Error Pages
export { NotFound, ServerError, Offline, BrowserUnsupported } from './ErrorPages'

// Auth Pages
export { Login, Register, ForgotPassword, VerifyEmail } from './Auth'

// Role-specific Ops Pages

export { TechnicianAvailability } from './TechnicianAvailability'
export { SiteOwnerSites } from './SiteOwnerSites'

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL PORTED FEATURES (from legacy batch 2)
// ═══════════════════════════════════════════════════════════════════════════

// Platform Monitoring
export { Alerts } from './Alerts'

// Financial Features
export { Payments } from './Payments'
export { Payouts } from './Payouts'

// Site Owner Features
export { Parking } from './Parking'
export { Tenants } from './Tenants'

// Owner Features (additional)
export { Discounts } from './Discounts'
export { StationMap } from './StationMap'
export { OwnerAlerts } from './OwnerAlerts'
export { Operators } from './Operators'
export { OwnerPlans } from './OwnerPlans'
export { OwnerSettlement } from './OwnerSettlement'

// Operator Features (additional)
export { OperatorJobs } from './OperatorJobs'
export { OperatorReports } from './OperatorReports'

// Technician Features (additional)
export { TechnicianSettlements } from './TechnicianSettlements'
export { TechnicianDocs } from './TechnicianDocs'

// Owner Advanced Features
export { BookingLedger } from './BookingLedger'
export { PricingRecipes } from './PricingRecipes'
export { LoadPolicy } from './LoadPolicy'
export { OwnerOperatorsReport } from './OwnerOperatorsReport'
export { ManualReserve } from './ManualReserve'
export { OperatorAssignments } from './OperatorAssignments'
export { OperatorAvailability } from './OperatorAvailability'

// Operator Tools
export { KioskScan } from './KioskScan'
export { OperatorSwapStationDetail } from './OperatorSwapStationDetail'
export { OperatorTeamDetail } from './OperatorTeamDetail'

