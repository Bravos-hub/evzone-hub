/**
 * Notice Hooks
 * React Query hooks for notice management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noticeService } from '../services/noticeService'
import type { NoticeRequest } from '@/core/api/types'

export function useNotices(tenantId?: string) {
  return useQuery({
    queryKey: ['notices', tenantId],
    queryFn: () => noticeService.getNotices(tenantId),
  })
}

export function useSendNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: NoticeRequest) => noticeService.sendNotice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
    },
  })
}
