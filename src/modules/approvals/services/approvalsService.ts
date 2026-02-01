import { API_CONFIG } from '@/core/api/config';

const baseURL = API_CONFIG.baseURL;

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
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);

        const url = `${baseURL}/approvals${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch approvals');
        return response.json();
    },

    async approveKyc(userId: string, reviewedBy: string, notes?: string): Promise<any> {
        const response = await fetch(`${baseURL}/approvals/kyc/${userId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy, notes }),
        });
        if (!response.ok) throw new Error('Failed to approve KYC');
        return response.json();
    },

    async rejectKyc(userId: string, reviewedBy: string, notes: string): Promise<any> {
        const response = await fetch(`${baseURL}/approvals/kyc/${userId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy, notes }),
        });
        if (!response.ok) throw new Error('Failed to reject KYC');
        return response.json();
    },

    async approveApplication(applicationId: string, reviewedBy: string, notes?: string): Promise<any> {
        const response = await fetch(`${baseURL}/approvals/application/${applicationId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy, notes }),
        });
        if (!response.ok) throw new Error('Failed to approve application');
        return response.json();
    },

    async rejectApplication(applicationId: string, reviewedBy: string, notes: string): Promise<any> {
        const response = await fetch(`${baseURL}/approvals/application/${applicationId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy, notes }),
        });
        if (!response.ok) throw new Error('Failed to reject application');
        return response.json();
    },
};
