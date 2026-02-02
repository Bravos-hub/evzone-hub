/**
 * Content Hooks
 * React Query hooks for content management
 */

import { useQuery } from '@tanstack/react-query'
import { contentService } from './contentService'

export function useContent(filters?: { type?: string; status?: string; locale?: string }) {
  return useQuery({
    queryKey: ['content', filters],
    queryFn: () => contentService.getAll(filters),
  })
}
