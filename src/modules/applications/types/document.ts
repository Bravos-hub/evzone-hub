/**
 * Document Management Types
 */

export interface Document {
    id: string
    category: DocumentCategory
    entityType: 'SITE' | 'APPLICATION' | 'TENANT' | 'USER'
    entityId: string
    fileName: string
    fileUrl: string
    fileType: 'PDF' | 'IMAGE'
    fileSize: number
    cloudinaryPublicId: string
    uploadedBy: string
    uploadedAt: string
    status: DocumentStatus
    verifiedBy?: string
    verifiedAt?: string
    rejectionReason?: string
    expiryDate?: string
    isRequired: boolean
    notes?: string
    metadata?: DocumentMetadata
}

export type DocumentStatus =
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | 'EXPIRED'
    | 'INFO_REQUESTED'

export type DocumentCategory =
    // Site Owner Documents
    | 'OWNERSHIP_PROOF'
    | 'OWNER_IDENTITY'
    | 'OWNER_ADDRESS_PROOF'
    | 'SITE_PHOTOS'
    | 'ELECTRICAL_CAPACITY'
    | 'SITE_PLAN'
    | 'LAND_USE_PERMIT'
    | 'SOCIETY_NOC'
    | 'LENDER_CONSENT'
    | 'CO_OWNER_CONSENT'
    | 'BUSINESS_REGISTRATION'
    // Operator Documents
    | 'OPERATOR_IDENTITY'
    | 'OPERATOR_ADDRESS_PROOF'
    | 'OPERATOR_PHOTO'
    | 'OPERATOR_BUSINESS_REG'
    | 'TAX_CERTIFICATE'
    | 'BANK_STATEMENTS'
    | 'INSTALLATION_LICENSE'
    | 'INSURANCE_CERTIFICATE'
    | 'PORTFOLIO'
    | 'INSTALLATION_PLAN'
    | 'EQUIPMENT_SPECS'
    // Lease Documents
    | 'LEASE_AGREEMENT'
    | 'LEASE_REGISTRATION'
    | 'STAMP_DUTY_RECEIPT'
    | 'SECURITY_DEPOSIT_RECEIPT'
    | 'INDEMNITY_BOND'
    | 'EXECUTED_LEASE'
    // Other
    | 'OTHER'

export interface DocumentMetadata {
    documentNumber?: string
    issuer?: string
    issueDate?: string
    [key: string]: any
}

export interface DocumentUploadRequest {
    category: DocumentCategory
    file: File
    expiryDate?: string
    notes?: string
}

export interface DocumentListFilters {
    status?: DocumentStatus
    category?: DocumentCategory
    entityType?: 'SITE' | 'APPLICATION' | 'TENANT' | 'USER'
}
