/**
 * Payment Types
 */

export interface Payment {
    id: string
    applicationId: string
    paidBy: string
    amount: number
    currency: string
    type: PaymentType
    method: PaymentMethod
    paymentGateway?: PaymentGateway
    transactionId?: string
    status: PaymentStatus
    receiptUrl?: string
    paidAt?: string
    refundedAt?: string
    refundReason?: string
}

export type PaymentType =
    | 'SECURITY_DEPOSIT'
    | 'FIRST_MONTH_RENT'
    | 'LEASE_REGISTRATION_FEE'
    | 'DAMAGE_CLAIM'
    | 'REFUND'

export type PaymentMethod =
    | 'CARD'
    | 'BANK_TRANSFER'
    | 'MOBILE_MONEY'
    | 'CASH'

export type PaymentGateway =
    | 'STRIPE'
    | 'PAYPAL'
    | 'MANUAL'

export type PaymentStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'REFUNDED'
    | 'CANCELLED'

export interface InitiatePaymentRequest {
    applicationId: string
    method: PaymentMethod
    amount?: number
}

export interface InitiatePaymentResponse {
    payment: Payment
    paymentUrl?: string // Redirect URL for card payments
    bankDetails?: BankTransferDetails // For bank transfers
}

export interface BankTransferDetails {
    accountName: string
    accountNumber: string
    bankName: string
    swiftCode?: string
    reference: string
}

export interface ConfirmPaymentRequest {
    paymentId: string
    transactionId?: string
    receiptFile?: File
}
