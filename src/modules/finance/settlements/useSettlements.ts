/**
 * Settlement Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { settlementService } from './settlementService'

export function useSettlements(filters?: { status?: string; region?: string }) {
  return useQuery({
    queryKey: ['settlements', filters],
    queryFn: () => settlementService.getAll(filters),
  })
}
