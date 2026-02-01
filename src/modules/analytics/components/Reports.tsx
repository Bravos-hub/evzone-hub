import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ReportType = 'Revenue' | 'Sessions' | 'Utilization' | 'Incidents' | 'Compliance'
type ReportFormat = 'PDF' | 'CSV' | 'Excel'

type ReportTemplate = {
  id: string
  name: string
  type: ReportType
  description: string
  lastGenerated: string
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'On-demand'
}

type GeneratedReport = {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  generatedAt: string
  size: string
  generatedBy: string
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

import { useReportTemplates, useGeneratedReports } from '@/modules/analytics/hooks/useReports'

export function Reports() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'reports')

  const { data: templates } = useReportTemplates()
  const { data: reports } = useGeneratedReports()

  const [tab, setTab] = useState<'templates' | 'generated'>('templates')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'All'>('All')

  const filteredTemplates = (templates || []).filter((t: any) => (typeFilter === 'All' ? true : t.type === typeFilter))
  const filteredReports = (reports || []).filter((r: any) => (typeFilter === 'All' ? true : r.type === typeFilter))

  return (
    <DashboardLayout pageTitle="Reports & Exports">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'templates' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
          onClick={() => setTab('templates')}
        >
          Report Templates
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'generated' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
          onClick={() => setTab('generated')}
        >
          Generated Reports
        </button>
      </div>

      {/* Filter */}
      <div className="card mb-4">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReportType | 'All')} className="select w-48">
          <option value="All">All Types</option>
          <option value="Revenue">Revenue</option>
          <option value="Sessions">Sessions</option>
          <option value="Utilization">Utilization</option>
          <option value="Incidents">Incidents</option>
          <option value="Compliance">Compliance</option>
        </select>
      </div>

      {tab === 'templates' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Type</th>
                <th>Frequency</th>
                <th>Last Generated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="font-semibold text-text">{t.name}</div>
                    <div className="text-xs text-muted">{t.description}</div>
                  </td>
                  <td><span className="chip">{t.type}</span></td>
                  <td>{t.frequency}</td>
                  <td className="text-sm">{t.lastGenerated}</td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      {perms.export && (
                        <button className="btn secondary" onClick={() => alert(`Generate ${t.name} (demo)`)}>
                          Generate
                        </button>
                      )}
                      {perms.schedule && (
                        <button className="btn secondary" onClick={() => alert(`Schedule ${t.name} (demo)`)}>
                          Schedule
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'generated' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Type</th>
                <th>Format</th>
                <th>Size</th>
                <th>Generated</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold text-text">{r.name}</td>
                  <td><span className="chip">{r.type}</span></td>
                  <td>{r.format}</td>
                  <td>{r.size}</td>
                  <td className="text-sm">{r.generatedAt}</td>
                  <td className="text-right">
                    <button className="btn secondary" onClick={() => alert(`Download ${r.name} (demo)`)}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

