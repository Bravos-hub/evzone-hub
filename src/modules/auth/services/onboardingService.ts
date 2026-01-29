import { apiClient } from '@/core/api/client';

export const onboardingService = {
    /**
     * Update branding (logo, bio)
     */
    async updateBranding(orgId: string, data: { logoUrl?: string; description?: string }) {
        return apiClient.patch(`/organizations/${orgId}`, data);
    },

    /**
     * Set up financial payout details
     */
    async setupPayouts(orgId: string, data: { provider: string; walletNumber: string; taxId?: string }) {
        return apiClient.post(`/organizations/${orgId}/payouts`, data);
    },

    /**
     * Final activation step
     */
    async activate(orgId: string, paymentData: any) {
        return apiClient.post(`/organizations/${orgId}/activate`, paymentData);
    }
};
