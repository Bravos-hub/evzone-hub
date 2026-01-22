import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportService } from '../services/reportService'

export function useReportTemplates() {
    return useQuery({
        queryKey: ['report-templates'],
        queryFn: reportService.getTemplates
    })
}

export function useGeneratedReports() {
    return useQuery({
        queryKey: ['generated-reports'],
        queryFn: reportService.getGeneratedReports
    })
}

export function useGenerateReport() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: reportService.generateReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['generated-reports'] })
        }
    })
}

export function useDownloadReport() {
    return useMutation({
        mutationFn: reportService.downloadReport
    })
}
