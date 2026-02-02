/**
 * Technician Docs Hooks
 * React Query hooks for technician docs
 */

import { useQuery } from '@tanstack/react-query'
import { technicianDocsService } from '../services/technicianDocsService'

export function useTechnicianDocs() {
  return useQuery({
    queryKey: ['technician-docs'],
    queryFn: () => technicianDocsService.getAll(),
  })
}
