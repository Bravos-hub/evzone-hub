import { GeneratedReport, ReportTemplate, ReportType } from '../types/reports'

// Initial Mock Data
const INITIAL_TEMPLATES: ReportTemplate[] = [
    { id: 'TPL-001', name: 'Monthly Revenue Summary', type: 'Revenue', description: 'Revenue breakdown by station and region', lastGenerated: '2024-12-01', frequency: 'Monthly' },
    { id: 'TPL-002', name: 'Session Analytics', type: 'Sessions', description: 'Session counts, durations, and completion rates', lastGenerated: '2024-12-24', frequency: 'Weekly' },
    { id: 'TPL-003', name: 'Station Utilization', type: 'Utilization', description: 'Utilization percentages and peak hours', lastGenerated: '2024-12-23', frequency: 'Daily' },
    { id: 'TPL-004', name: 'Incident Report', type: 'Incidents', description: 'All incidents with resolution times', lastGenerated: '2024-12-24', frequency: 'On-demand' },
    { id: 'TPL-005', name: 'Compliance Audit', type: 'Compliance', description: 'Regulatory compliance status', lastGenerated: '2024-11-30', frequency: 'Monthly' },
]

const INITIAL_REPORTS: GeneratedReport[] = [
    { id: 'RPT-001', name: 'November Revenue Summary', type: 'Revenue', format: 'PDF', generatedAt: '2024-12-01 09:00', size: '2.4 MB', generatedBy: 'System' },
    { id: 'RPT-002', name: 'Week 51 Sessions', type: 'Sessions', format: 'Excel', generatedAt: '2024-12-24 06:00', size: '1.1 MB', generatedBy: 'System' },
    { id: 'RPT-003', name: 'Daily Utilization Dec 23', type: 'Utilization', format: 'CSV', generatedAt: '2024-12-24 00:05', size: '450 KB', generatedBy: 'System' },
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
        return [...INITIAL_REPORTS]
    },

    generateReport: async (templateId: string): Promise<GeneratedReport> => {
        await new Promise(resolve => setTimeout(resolve, 1500))

        const template = INITIAL_TEMPLATES.find(t => t.id === templateId)
        if (!template) throw new Error('Template not found')

        const newReport: GeneratedReport = {
            id: `RPT-${Date.now()}`,
            name: `${template.name} - ${new Date().toLocaleDateString()}`,
            type: template.type,
            format: 'PDF', // Default
            generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
            generatedBy: 'User' // In real app, get current user
        }

        // Persist
        const existing = await reportService.getGeneratedReports()
        const updated = [newReport, ...existing]
        localStorage.setItem('evzone_generated_reports', JSON.stringify(updated))

        return newReport
    },

    downloadReport: async (reportId: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log(`Downloading report ${reportId}`)
        // This would return a Blob url in a real app
        return true
    }
}
