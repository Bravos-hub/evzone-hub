/**
 * Discount Hooks
 * React Query hooks for discounts/promotions
 */

import { useQuery } from '@tanstack/react-query'
import { discountService } from './discountService'

export function useDiscounts(filters?: { status?: string; type?: string; siteId?: string }) {
  return useQuery({
    queryKey: ['discounts', filters],
    queryFn: () => discountService.getAll(filters),
  })
}
