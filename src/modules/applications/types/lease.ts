/**
 * Lease Document Types
 */

export interface LeaseDocument {
    id: string
    applicationId: string
    type: LeaseDocumentType
    fileUrl: string
    status: LeaseDocumentStatus
    createdAt: string
    signedBy?: string[]
    verifiedBy?: string
    verifiedAt?: string
}

export type LeaseDocumentType =
    | 'DRAFT'
    | 'UNSIGNED'
    | 'OWNER_SIGNED'
    | 'FULLY_SIGNED'
    | 'REGISTERED'

export type LeaseDocumentStatus =
    | 'DRAFT'
    | 'PENDING_SIGNATURE'
    | 'PARTIALLY_SIGNED'
    | 'FULLY_SIGNED'
    | 'VERIFIED'
    | 'REJECTED'

export interface GenerateLeaseRequest {
    applicationId: string
}

export interface UploadSignedLeaseRequest {
    applicationId: string
    file: File
    signedBy: 'OWNER' | 'OPERATOR' | 'BOTH'
}

export interface VerifyLeaseRequest {
    applicationId: string
    approved: boolean
    notes?: string
}
