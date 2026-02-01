import { apiClient as api } from '@/core/api/client';

export type ApprovalType = 'KYC' | 'ACCESS_REQUEST' | 'DOCUMENT_VERIFICATION' | 'TENANT_APPLICATION';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ApprovalItem = {
    id: string;
    type: ApprovalType;
    applicantId: string;
    applicantName: string;
    resourceId?: string;
    details: any;
    status: ApprovalStatus;
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNotes?: string;
};

export const approvalsService = {
    async getPendingApprovals(filters?: { type?: ApprovalType }): Promise<ApprovalItem[]> {
        return await api.get('/approvals', { params: filters } as any);
    },

    async approveKyc(userId: string, reviewedBy: string, notes?: string): Promise<any> {
        return await api.post(`/approvals/kyc/${userId}/approve`, { reviewedBy, notes });
    },

    async rejectKyc(userId: string, reviewedBy: string, notes: string): Promise<any> {
        return await api.post(`/approvals/kyc/${userId}/reject`, { reviewedBy, notes });
    },

    async approveApplication(applicationId: string, reviewedBy: string, notes?: string): Promise<any> {
        // Assuming backend expects request ID or resource ID. Service uses 'applicationId' as ID.
        return await api.post(`/approvals/application/${applicationId}/approve`, { reviewedBy, notes });
    },

    async rejectApplication(applicationId: string, reviewedBy: string, notes: string): Promise<any> {
        return await api.post(`/approvals/application/${applicationId}/reject`, { reviewedBy, notes });
    },
};
