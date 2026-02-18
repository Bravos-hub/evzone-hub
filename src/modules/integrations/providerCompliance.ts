import type {
  ProviderComplianceGate,
  ProviderComplianceStatus,
  ProviderDocument,
  ProviderDocumentType,
  ProviderRequirementCondition,
  ProviderRequirementDefinition,
  ProviderRequirementScope,
  SwapProvider,
} from '@/core/api/types'

type ComplianceContext = {
  provider?: SwapProvider | null
}

const GATE_ORDER: ProviderComplianceGate[] = ['KYB', 'SAFETY', 'OPERATIONS', 'INTEGRATION']
const EXPIRY_WARNING_DAYS = 30

const PROVIDER_REQUIREMENTS: ProviderRequirementDefinition[] = [
  {
    requirementCode: 'PRV_CORP_INCORP',
    title: 'Certificate of incorporation or business registration',
    gate: 'KYB',
    category: 'CORPORATE',
    isCritical: true,
    acceptedDocTypes: ['INCORPORATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_TAX_REG',
    title: 'Tax registration (VAT/TIN) and operating address proof',
    gate: 'KYB',
    category: 'CORPORATE',
    isCritical: true,
    acceptedDocTypes: ['TAX_COMPLIANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_SIGNATORY_AUTH',
    title: 'Authorized signatory proof / board resolution',
    gate: 'KYB',
    category: 'CORPORATE',
    isCritical: true,
    acceptedDocTypes: ['INCORPORATION', 'COMMERCIAL_AGREEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_BANK_VERIFICATION',
    title: 'Bank account verification for settlements',
    gate: 'KYB',
    category: 'COMMERCIAL',
    isCritical: false,
    acceptedDocTypes: ['COMMERCIAL_AGREEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_UN38_3_REPORT',
    title: 'UN 38.3 transport safety report',
    gate: 'SAFETY',
    category: 'SAFETY',
    isCritical: true,
    acceptedDocTypes: ['BATTERY_SAFETY_CERTIFICATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_UN38_3_SUMMARY',
    title: 'UN 38.3 test summary for supply-chain disclosure',
    gate: 'SAFETY',
    category: 'SAFETY',
    isCritical: true,
    acceptedDocTypes: ['BATTERY_SAFETY_CERTIFICATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_IEC_62619',
    title: 'IEC 62619 certification or equivalent industrial battery safety evidence',
    gate: 'SAFETY',
    category: 'SAFETY',
    isCritical: true,
    acceptedDocTypes: ['BATTERY_SAFETY_CERTIFICATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_TRACTION_ABUSE_TEST',
    title: 'Traction battery abuse testing evidence (UL 2580 / independent lab)',
    gate: 'SAFETY',
    category: 'SAFETY',
    isCritical: false,
    acceptedDocTypes: ['BATTERY_SAFETY_CERTIFICATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_DANGEROUS_GOODS_PROC',
    title: 'Dangerous goods shipping procedure',
    gate: 'SAFETY',
    category: 'OPERATIONS',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT', 'BATTERY_SAFETY_CERTIFICATION'],
    appliesTo: 'PROVIDER',
    conditions: [
      {
        key: 'crossBorderShipping',
        operator: 'eq',
        value: true,
        description: 'Required only when cross-border shipping is enabled.',
      },
    ],
  },
  {
    requirementCode: 'PRV_BATTERY_ID_SCHEME',
    title: 'Battery model spec, serial scheme, UID/QR labeling',
    gate: 'OPERATIONS',
    category: 'TRACEABILITY',
    isCritical: true,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_SOH_RETIREMENT_POLICY',
    title: 'SoH/cycle-life thresholds and retirement policy',
    gate: 'OPERATIONS',
    category: 'TRACEABILITY',
    isCritical: true,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_LIFECYCLE_HISTORY_POLICY',
    title: 'Lifecycle history event capture policy',
    gate: 'OPERATIONS',
    category: 'TRACEABILITY',
    isCritical: false,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_INTERFACE_CONTROL_DOC',
    title: 'Interface control document (connector, lock, insulation, IP)',
    gate: 'INTEGRATION',
    category: 'INTEROPERABILITY',
    isCritical: true,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'SITE_COMPATIBILITY_DECLARATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_INTERFACE_SAFETY_TEST',
    title: 'Dielectric/insulation interface test evidence',
    gate: 'INTEGRATION',
    category: 'INTEROPERABILITY',
    isCritical: true,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'BATTERY_SAFETY_CERTIFICATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_BMS_PROTOCOL_SPEC',
    title: 'BMS + communication protocol + firmware update policy',
    gate: 'INTEGRATION',
    category: 'INTEROPERABILITY',
    isCritical: true,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_SWAP_SYSTEM_SAFETY',
    title: 'Swap-system safety alignment (IEC 62840 series evidence)',
    gate: 'INTEGRATION',
    category: 'INTEROPERABILITY',
    isCritical: false,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'SITE_COMPATIBILITY_DECLARATION'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_HANDLING_STORAGE_SOP',
    title: 'Battery handling and storage SOP',
    gate: 'OPERATIONS',
    category: 'OPERATIONS',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_CHARGING_SOP',
    title: 'Charging SOP (rates, monitoring, alarms)',
    gate: 'OPERATIONS',
    category: 'OPERATIONS',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_MAINTENANCE_PLAN',
    title: 'Preventive maintenance and diagnostics plan',
    gate: 'OPERATIONS',
    category: 'OPERATIONS',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_INCIDENT_RESPONSE',
    title: 'Failure and incident response playbook',
    gate: 'SAFETY',
    category: 'OPERATIONS',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_RECALL_PROCEDURE',
    title: 'Recall/field action and customer notification procedure',
    gate: 'SAFETY',
    category: 'OPERATIONS',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_PRODUCT_LIABILITY_INSURANCE',
    title: 'Product liability insurance',
    gate: 'KYB',
    category: 'INSURANCE',
    isCritical: true,
    acceptedDocTypes: ['INSURANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_GENERAL_LIABILITY_INSURANCE',
    title: 'General commercial liability insurance',
    gate: 'KYB',
    category: 'INSURANCE',
    isCritical: true,
    acceptedDocTypes: ['INSURANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_ASSET_TRANSIT_INSURANCE',
    title: 'BaaS asset/inland transit insurance',
    gate: 'OPERATIONS',
    category: 'INSURANCE',
    isCritical: false,
    acceptedDocTypes: ['INSURANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_EPR_REGISTRATION',
    title: 'EPR registration and recycler/take-back agreement',
    gate: 'OPERATIONS',
    category: 'ENVIRONMENT',
    isCritical: false,
    acceptedDocTypes: ['RECYCLING_COMPLIANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_RECYCLER_AGREEMENT',
    title: 'Authorized recycler agreement',
    gate: 'OPERATIONS',
    category: 'ENVIRONMENT',
    isCritical: true,
    acceptedDocTypes: ['RECYCLING_COMPLIANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_INFOSEC_POLICY',
    title: 'Information security policy and vulnerability reporting contact',
    gate: 'INTEGRATION',
    category: 'CYBER',
    isCritical: false,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_API_SECURITY_DOC',
    title: 'API security documentation (auth, key rotation, logging, least privilege)',
    gate: 'INTEGRATION',
    category: 'CYBER',
    isCritical: true,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_CYBER_INCIDENT_PLAN',
    title: 'Cyber incident response plan',
    gate: 'INTEGRATION',
    category: 'CYBER',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT', 'TECHNICAL_CONFORMANCE'],
    appliesTo: 'PROVIDER',
  },
  {
    requirementCode: 'PRV_DATA_RETENTION_POLICY',
    title: 'Data retention and privacy policy',
    gate: 'INTEGRATION',
    category: 'CYBER',
    isCritical: false,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'COMMERCIAL_AGREEMENT'],
    appliesTo: 'PROVIDER',
  },
]

const STATION_OWNER_REQUIREMENTS: ProviderRequirementDefinition[] = [
  {
    requirementCode: 'STN_BUSINESS_REGISTRATION',
    title: 'Business registration and tax registration',
    gate: 'KYB',
    category: 'CORPORATE',
    isCritical: true,
    acceptedDocTypes: ['INCORPORATION', 'TAX_COMPLIANCE'],
    appliesTo: 'STATION_OWNER',
  },
  {
    requirementCode: 'STN_SITE_PERMITS',
    title: 'Site permits and fire/electrical clearances',
    gate: 'SAFETY',
    category: 'SITE_PERMITS',
    isCritical: true,
    acceptedDocTypes: ['SITE_COMPATIBILITY_DECLARATION', 'TECHNICAL_CONFORMANCE'],
    appliesTo: 'STATION_OWNER',
  },
  {
    requirementCode: 'STN_OPERATIONAL_SOPS',
    title: 'Station SOPs, emergency plan, and staff competency',
    gate: 'OPERATIONS',
    category: 'OPERATIONS',
    isCritical: true,
    acceptedDocTypes: ['SOP_ACKNOWLEDGEMENT'],
    appliesTo: 'STATION_OWNER',
  },
  {
    requirementCode: 'STN_CYBER_INTEGRATION',
    title: 'Integration acceptance testing and cyber controls',
    gate: 'INTEGRATION',
    category: 'CYBER',
    isCritical: true,
    acceptedDocTypes: ['TECHNICAL_CONFORMANCE', 'SITE_COMPATIBILITY_DECLARATION'],
    appliesTo: 'STATION_OWNER',
  },
]

function toVerificationState(document: ProviderDocument): 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' {
  if (document.verificationStatus) return document.verificationStatus
  if (document.status === 'APPROVED') return 'VERIFIED'
  if (document.status === 'REJECTED') return 'REJECTED'
  return 'UNVERIFIED'
}

function isVerified(document: ProviderDocument): boolean {
  return toVerificationState(document) === 'VERIFIED'
}

function parseDate(value?: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isExpiringSoon(document: ProviderDocument, now: Date): boolean {
  const expiry = parseDate(document.expiryDate)
  if (!expiry || expiry < now) return false
  const diffMs = expiry.getTime() - now.getTime()
  return diffMs <= EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000
}

function evaluateCondition(condition: ProviderRequirementCondition, context: ComplianceContext): boolean {
  const provider = context.provider
  if (!provider) return false

  if (condition.key === 'crossBorderShipping') {
    const countries = provider.countries || []
    const regions = provider.regions || []
    const inferredCrossBorder = countries.length > 1 || regions.length > 1
    if (condition.operator === 'eq') return inferredCrossBorder === Boolean(condition.value)
    return inferredCrossBorder
  }

  if (condition.key === 'supportsInteroperability') {
    const capabilities = provider.protocolCapabilities || []
    const isInterop = provider.standard === 'Universal' || capabilities.includes('INTEROPERABILITY')
    if (condition.operator === 'eq') return isInterop === Boolean(condition.value)
    return isInterop
  }

  return true
}

function requirementApplies(requirement: ProviderRequirementDefinition, context: ComplianceContext): boolean {
  const conditions = requirement.conditions || []
  if (conditions.length === 0) return true
  return conditions.every((condition) => evaluateCondition(condition, context))
}

function findMatchingDocument(
  requirement: ProviderRequirementDefinition,
  documents: ProviderDocument[],
  consumedIds: Set<string>,
): ProviderDocument | undefined {
  return documents.find((doc) => {
    if (consumedIds.has(doc.id)) return false
    if (!isVerified(doc)) return false
    if (doc.requirementCode) return doc.requirementCode === requirement.requirementCode
    return requirement.acceptedDocTypes.includes(doc.type)
  })
}

function getRequirementByDocument(
  requirements: ProviderRequirementDefinition[],
  document: ProviderDocument,
): ProviderRequirementDefinition | undefined {
  if (document.requirementCode) {
    return requirements.find((item) => item.requirementCode === document.requirementCode)
  }
  return requirements.find((item) => item.acceptedDocTypes.includes(document.type))
}

function stableRequirementSort(a: ProviderRequirementDefinition, b: ProviderRequirementDefinition): number {
  if (a.gate !== b.gate) return GATE_ORDER.indexOf(a.gate) - GATE_ORDER.indexOf(b.gate)
  if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1
  return a.title.localeCompare(b.title)
}

export function getFallbackProviderRequirements(
  appliesTo: ProviderRequirementScope = 'PROVIDER',
): ProviderRequirementDefinition[] {
  const base = appliesTo === 'PROVIDER' ? PROVIDER_REQUIREMENTS : STATION_OWNER_REQUIREMENTS
  return [...base].sort(stableRequirementSort)
}

export function getRequirementDocTypeMapping(): Record<ProviderDocumentType, string[]> {
  const all = [...PROVIDER_REQUIREMENTS, ...STATION_OWNER_REQUIREMENTS]
  return all.reduce<Record<ProviderDocumentType, string[]>>((acc, requirement) => {
    requirement.acceptedDocTypes.forEach((docType) => {
      if (!acc[docType]) acc[docType] = []
      if (!acc[docType].includes(requirement.requirementCode)) {
        acc[docType].push(requirement.requirementCode)
      }
    })
    return acc
  }, {} as Record<ProviderDocumentType, string[]>)
}

export function evaluateProviderCompliance(options: {
  providerId: string
  provider?: SwapProvider | null
  documents: ProviderDocument[]
  requirements: ProviderRequirementDefinition[]
}): ProviderComplianceStatus {
  const { providerId, provider, documents, requirements } = options
  const now = new Date()
  const context: ComplianceContext = { provider }
  const activeRequirements = requirements.filter((item) => requirementApplies(item, context)).sort(stableRequirementSort)
  const consumedDocumentIds = new Set<string>()
  const satisfiedCodes = new Set<string>()

  activeRequirements.forEach((requirement) => {
    const match = findMatchingDocument(requirement, documents, consumedDocumentIds)
    if (match) {
      consumedDocumentIds.add(match.id)
      satisfiedCodes.add(requirement.requirementCode)
    }
  })

  const gateStatuses: ProviderComplianceStatus['gateStatuses'] = GATE_ORDER.map((gate) => {
    const requirementsForGate = activeRequirements.filter((item) => item.gate === gate)
    const missingCritical = requirementsForGate
      .filter((item) => item.isCritical && !satisfiedCodes.has(item.requirementCode))
      .map((item) => item.requirementCode)
    const missingRecommended = requirementsForGate
      .filter((item) => !item.isCritical && !satisfiedCodes.has(item.requirementCode))
      .map((item) => item.requirementCode)

    const met = requirementsForGate.length - missingCritical.length - missingRecommended.length
    const criticalRequired = requirementsForGate.filter((item) => item.isCritical).length
    const criticalMet = criticalRequired - missingCritical.length

    const status: 'PASS' | 'WARN' | 'BLOCKED' =
      missingCritical.length > 0 ? 'BLOCKED' : missingRecommended.length > 0 ? 'WARN' : 'PASS'

    return {
      gate,
      required: requirementsForGate.length,
      met,
      criticalRequired,
      criticalMet,
      missingCritical,
      missingRecommended,
      status,
    }
  })

  const missingCritical = gateStatuses.flatMap((item) => item.missingCritical)
  const missingRecommended = gateStatuses.flatMap((item) => item.missingRecommended)
  const expiringSoon = documents.filter((item) => isVerified(item) && isExpiringSoon(item, now))
  const expiredCritical = documents.filter((item) => {
    if (!isVerified(item)) return false
    const expiry = parseDate(item.expiryDate)
    if (!expiry || expiry >= now) return false
    const requirement = getRequirementByDocument(activeRequirements, item)
    return Boolean(requirement?.isCritical)
  })

  const blockerReasonCodes = [
    ...missingCritical.map((code) => `MISSING_${code}`),
    ...expiredCritical.map((item) => `DOC_EXPIRED_CRITICAL:${item.id}`),
  ]

  const overallState: ProviderComplianceStatus['overallState'] =
    blockerReasonCodes.length > 0 ? 'BLOCKED' : missingRecommended.length > 0 || expiringSoon.length > 0 ? 'WARN' : 'READY'

  return {
    providerId,
    evaluatedAt: now.toISOString(),
    gateStatuses,
    missingCritical,
    missingRecommended,
    expiringSoon,
    expiredCritical,
    overallState,
    blockerReasonCodes,
  }
}
