import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsService, type ApprovalType } from '../services/approvalsService';

export function useApprovals(filters?: { type?: ApprovalType }) {
    return useQuery({
        queryKey: ['approvals', filters],
        queryFn: () => approvalsService.getPendingApprovals(filters),
    });
}

export function useApproveKyc() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, reviewedBy, notes }: { userId: string; reviewedBy: string; notes?: string }) =>
            approvalsService.approveKyc(userId, reviewedBy, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}

export function useRejectKyc() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, reviewedBy, notes }: { userId: string; reviewedBy: string; notes: string }) =>
            approvalsService.rejectKyc(userId, reviewedBy, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}

export function useApproveApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ applicationId, reviewedBy, notes }: { applicationId: string; reviewedBy: string; notes?: string }) =>
            approvalsService.approveApplication(applicationId, reviewedBy, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}

export function useRejectApplication() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ applicationId, reviewedBy, notes }: { applicationId: string; reviewedBy: string; notes: string }) =>
            approvalsService.rejectApplication(applicationId, reviewedBy, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}
