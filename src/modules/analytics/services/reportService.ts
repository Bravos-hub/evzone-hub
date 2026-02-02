import { GeneratedReport, ReportTemplate } from '../types/reports'
import { apiClient } from '@/core/api/client'

export const reportService = {
    getTemplates: async (): Promise<ReportTemplate[]> => {
        return apiClient.get<ReportTemplate[]>('/reports/templates')
    },

    getGeneratedReports: async (): Promise<GeneratedReport[]> => {
        return apiClient.get<GeneratedReport[]>('/reports/generated')
    },

    generateReport: async (templateId: string): Promise<GeneratedReport> => {
        return apiClient.post<GeneratedReport>(`/reports/generate/${templateId}`)
    },

    downloadReport: async (reportId: string, name?: string) => {
        try {
            const blob = await apiClient.get<Blob>(`/reports/${reportId}/download`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${name || 'report'}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            return true
        } catch (error) {
            console.error('Failed to download report:', error)
            return false
        }
    }
}
