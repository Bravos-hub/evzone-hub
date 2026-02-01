import { API_CONFIG } from '@/core/api/config';

const baseURL = API_CONFIG.baseURL;

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
    limits?: any;
    features?: PlanFeature[];
    permissions?: PlanPermission[];
    createdAt: string;
    updatedAt: string;
};

export type PlanFeature = {
    id: string;
    name: string;
    category?: string;
    order?: number;
};

export type PlanPermission = {
    id: string;
    resource: string;
    action: string;
    scope?: string;
    limit?: number;
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
    limits?: any;
    features?: Omit<PlanFeature, 'id'>[];
    permissions?: Omit<PlanPermission, 'id'>[];
};

export type UpdatePlanDto = Partial<CreatePlanDto>;

export const subscriptionPlansService = {
    async getAll(filters?: { role?: string; isActive?: boolean; isPublic?: boolean }): Promise<SubscriptionPlan[]> {
        const params = new URLSearchParams();
        if (filters?.role) params.append('role', filters.role);
        if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
        if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));

        const url = `${baseURL}/subscription-plans${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch subscription plans');
        return response.json();
    },

    async getById(id: string): Promise<SubscriptionPlan> {
        const response = await fetch(`${baseURL}/subscription-plans/${id}`);
        if (!response.ok) throw new Error('Failed to fetch subscription plan');
        return response.json();
    },

    async getByCode(code: string): Promise<SubscriptionPlan> {
        const response = await fetch(`${baseURL}/subscription-plans/code/${code}`);
        if (!response.ok) throw new Error('Failed to fetch subscription plan');
        return response.json();
    },

    async create(data: CreatePlanDto): Promise<SubscriptionPlan> {
        const response = await fetch(`${baseURL}/subscription-plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create subscription plan');
        return response.json();
    },

    async update(id: string, data: UpdatePlanDto): Promise<SubscriptionPlan> {
        const response = await fetch(`${baseURL}/subscription-plans/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update subscription plan');
        return response.json();
    },

    async toggleActive(id: string, isActive: boolean): Promise<SubscriptionPlan> {
        const response = await fetch(`${baseURL}/subscription-plans/${id}/toggle-active`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive }),
        });
        if (!response.ok) throw new Error('Failed to toggle plan status');
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${baseURL}/subscription-plans/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete subscription plan');
    },
};
