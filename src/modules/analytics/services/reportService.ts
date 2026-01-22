import { GeneratedReport, ReportTemplate, ReportType } from '../types/reports'
import { applicationService, leaseService } from '@/modules/applications/services'
import { stationService } from '@/modules/stations/services/stationService'

// Initial Mock Data
const INITIAL_TEMPLATES: ReportTemplate[] = [
    { id: 'TPL-001', name: 'Monthly Revenue Summary', type: 'Revenue', description: 'Revenue breakdown by station and region', lastGenerated: '2024-12-01', frequency: 'Monthly' },
    { id: 'TPL-002', name: 'Session Analytics', type: 'Sessions', description: 'Session counts, durations, and completion rates', lastGenerated: '2024-12-24', frequency: 'Weekly' },
    { id: 'TPL-003', name: 'Station Utilization', type: 'Utilization', description: 'Utilization percentages and peak hours', lastGenerated: '2024-12-23', frequency: 'Daily' },
    { id: 'TPL-004', name: 'Incident Report', type: 'Incidents', description: 'All incidents with resolution times', lastGenerated: '2024-12-24', frequency: 'On-demand' },
    { id: 'TPL-005', name: 'Compliance Audit', type: 'Compliance', description: 'Regulatory compliance status', lastGenerated: '2024-11-30', frequency: 'Monthly' },
]

export const reportService = {
    getTemplates: async (): Promise<ReportTemplate[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        return [...INITIAL_TEMPLATES]
    },

    getGeneratedReports: async (): Promise<GeneratedReport[]> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        // Retrieve from local storage if available to "persist" across reloads in demo
        const stored = localStorage.getItem('evzone_generated_reports')
        if (stored) {
            return JSON.parse(stored)
        }
        return []
    },

    generateReport: async (templateId: string): Promise<GeneratedReport> => {
        const template = INITIAL_TEMPLATES.find(t => t.id === templateId)
        if (!template) throw new Error('Template not found')

        let reportContent = `Report: ${template.name}\nGenerated: ${new Date().toISOString()}\n----------------------------------------\n`

        try {
            // Fetch some real metrics based on report type
            if (template.type === 'Revenue' || template.type === 'Compliance') {
                const applications = await applicationService.list()
                reportContent += `Total Applications: ${applications.length}\n`
                reportContent += `Active Sites: ${applications.filter(a => a.status === 'COMPLETED' || a.status === 'LEASE_SIGNED').length}\n`
                if (template.type === 'Revenue') {
                    // Mock revenue calculation from apps
                    const potentialRevenue = applications.reduce((sum, app) => sum + (app.negotiatedTerms?.monthlyRent || 0), 0)
                    reportContent += `Projected Monthly Site Revenue: $${potentialRevenue}\n`
                }
            } else if (template.type === 'Utilization' || template.type === 'Sessions') {
                const stations = await stationService.getAll()
                reportContent += `Total Stations: ${stations.length}\n`
                reportContent += `Active Stations: ${stations.filter(s => s.status === 'ACTIVE').length}\n`
                reportContent += `Total Capacity (kW): ${stations.reduce((sum, s) => sum + (s.capacity || 0), 0)}\n`
            }
        } catch (error) {
            console.warn('Failed to fetch real stats for report', error)
            reportContent += `Error fetching stats: ${error}\n`
        }

        reportContent += `\n[End of Report]`

        const blob = new Blob([reportContent], { type: 'text/plain' })
        const file = new File([blob], `${template.name.replace(/\s+/g, '_')}_${Date.now()}.txt`, { type: 'text/plain' })

        let secureUrl = ''
        try {
            const { uploadImageToCloudinary } = await import('@/core/utils/cloudinary')
            secureUrl = await uploadImageToCloudinary(file)
        } catch (error) {
            console.warn('Cloudinary upload failed (likely config missing or file type), using mock URL', error)
            // Fallback to a data URI if cloud upload fails, so download still 'works' locally for small text
            secureUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(reportContent)}`
        }

        const newReport: GeneratedReport = {
            id: `RPT-${Date.now()}`,
            name: `${template.name} - ${new Date().toLocaleDateString()}`,
            type: template.type,
            format: 'PDF', // Keeping PDF as UI label for now
            generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            size: `${(blob.size / 1024).toFixed(1)} KB`,
            generatedBy: 'User',
            url: secureUrl
        }

        // Persist
        const existing = await reportService.getGeneratedReports()
        const updated = [newReport, ...existing]
        localStorage.setItem('evzone_generated_reports', JSON.stringify(updated))
        // Also ensure url is stored in the object itself as done above

        return newReport
    },

    downloadReport: async (reportId: string, name?: string) => {
        // Retrieve from latest list (in case URL is in object)
        const reports = await reportService.getGeneratedReports()
        const report = reports.find(r => r.id === reportId)

        if (report?.url) {
            const link = document.createElement('a')
            link.href = report.url
            link.target = '_blank'

            // If it's a data URI, we can force download name
            if (report.url.startsWith('data:')) {
                link.download = `${name || 'report'}.txt`
            }

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            return true
        }
        return false
    }
}
