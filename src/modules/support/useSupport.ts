/**
 * Support Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { supportService } from './supportService'

export function useSupportTickets(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['support', 'tickets', filters],
    queryFn: () => supportService.getTickets(filters),
  })
}
