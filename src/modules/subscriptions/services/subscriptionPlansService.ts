import { apiClient as api } from '@/core/api/client';

export type SubscriptionPlan = {
    id: string;
    code: string;
    name: string;
    description: string;
    role: string;
    price: number;
    currency: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    isActive: boolean;
    isPublic: boolean;
    isPopular: boolean;
    features?: PlanFeature[];
    permissions?: PlanPermission[];
    createdAt: string;
    updatedAt: string;
};

export type PlanFeature = {
    id: string;
    key: string;
    featureValue: string;
    description?: string;
    order?: number;
};

export type PlanPermission = {
    id: string;
    resource: string;
    action: string;
};

export type CreatePlanDto = {
    code: string;
    name: string;
    description: string;
    role: string;
    price: number;
    currency: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    isActive?: boolean;
    isPublic?: boolean;
    isPopular?: boolean;
    features?: { key: string; value: string; description?: string; order?: number }[];
};

export type UpdatePlanDto = Partial<CreatePlanDto>;

export const subscriptionPlansService = {
    async getAll(filters?: { role?: string; isActive?: boolean; isPublic?: boolean }): Promise<SubscriptionPlan[]> {
        return await api.get('/subscription-plans', { params: filters } as any);
    },

    async getById(id: string): Promise<SubscriptionPlan> {
        return await api.get(`/subscription-plans/${id}`);
    },

    async getByCode(code: string): Promise<SubscriptionPlan> {
        return await api.get(`/subscription-plans/code/${code}`);
    },

    async create(planData: CreatePlanDto): Promise<SubscriptionPlan> {
        return await api.post('/subscription-plans', planData);
    },

    async update(id: string, planData: UpdatePlanDto): Promise<SubscriptionPlan> {
        return await api.patch(`/subscription-plans/${id}`, planData);
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/subscription-plans/${id}`);
    },

    async toggleActive(id: string, isActive: boolean): Promise<SubscriptionPlan> {
        return await api.patch(`/subscription-plans/${id}`, { isActive });
    }
};
