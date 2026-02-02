/**
 * Notice Template Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { noticeTemplateService } from '../services/noticeTemplateService'

export function useNoticeTemplates() {
  return useQuery({
    queryKey: ['notices', 'templates'],
    queryFn: () => noticeTemplateService.getTemplates(),
  })
}
