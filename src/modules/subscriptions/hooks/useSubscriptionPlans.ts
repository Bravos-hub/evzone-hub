import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionPlansService, type CreatePlanDto, type UpdatePlanDto } from '../services/subscriptionPlansService';

export function useSubscriptionPlans(filters?: { role?: string; isActive?: boolean; isPublic?: boolean }) {
    return useQuery({
        queryKey: ['subscription-plans', filters],
        queryFn: () => subscriptionPlansService.getAll(filters),
    });
}

export function useSubscriptionPlan(id: string) {
    return useQuery({
        queryKey: ['subscription-plans', id],
        queryFn: () => subscriptionPlansService.getById(id),
        enabled: !!id,
    });
}

export function useSubscriptionPlanByCode(code: string) {
    return useQuery({
        queryKey: ['subscription-plans', 'code', code],
        queryFn: () => subscriptionPlansService.getByCode(code),
        enabled: !!code,
    });
}

export function useCreateSubscriptionPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePlanDto) => subscriptionPlansService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
        },
    });
}

export function useUpdateSubscriptionPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePlanDto }) =>
            subscriptionPlansService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-plans', id] });
        },
    });
}

export function useToggleSubscriptionPlanActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            subscriptionPlansService.toggleActive(id, isActive),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
            queryClient.invalidateQueries({ queryKey: ['subscription-plans', id] });
        },
    });
}

export function useDeleteSubscriptionPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => subscriptionPlansService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
        },
    });
}
