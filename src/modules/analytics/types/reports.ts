
export type ReportType = 'Revenue' | 'Sessions' | 'Utilization' | 'Incidents' | 'Compliance'
export type ReportFormat = 'PDF' | 'CSV' | 'Excel'

export interface ReportTemplate {
    id: string
    name: string
    type: ReportType
    description: string
    lastGenerated: string
    frequency: 'Daily' | 'Weekly' | 'Monthly' | 'On-demand'
}

export interface GeneratedReport {
    id: string
    name: string
    type: ReportType
    format: ReportFormat
    generatedAt: string
    size: string
    generatedBy: string
    url?: string
}
