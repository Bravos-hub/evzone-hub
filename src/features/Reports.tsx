import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useReportTemplates, useGeneratedReports, useGenerateReport, useDownloadReport } from '@/modules/analytics/hooks/useReports'
import { ReportType } from '@/modules/analytics/types/reports'

export function Reports() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'reports')

  const [tab, setTab] = useState<'templates' | 'generated'>('templates')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'All'>('All')

  // Queries
  const { data: templates = [], isLoading: loadingTemplates } = useReportTemplates()
  const { data: reports = [], isLoading: loadingReports } = useGeneratedReports()

  // Mutations
  const generateReport = useGenerateReport()
  const downloadReport = useDownloadReport()

  const filteredTemplates = templates.filter((t) => (typeFilter === 'All' ? true : t.type === typeFilter))
  const filteredReports = reports.filter((r) => (typeFilter === 'All' ? true : r.type === typeFilter))

  const handleGenerate = (templateId: string, name: string) => {
    generateReport.mutate(templateId, {
      onSuccess: () => {
        setTab('generated')
      }
    })
  }

  const handleDownload = (reportId: string, name: string) => {
    downloadReport.mutate({ id: reportId, name }, {
      onSuccess: () => {
        // In a real app, this would handle the blob
        // alert(`Downloaded ${name}`)
      }
    })
  }

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
      <div className="card mb-4 flex justify-between items-center">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ReportType | 'All')} className="select w-48 bg-white/5">
          <option value="All">All Types</option>
          <option value="Revenue">Revenue</option>
          <option value="Sessions">Sessions</option>
          <option value="Utilization">Utilization</option>
          <option value="Incidents">Incidents</option>
          <option value="Compliance">Compliance</option>
        </select>

        {(loadingTemplates || loadingReports) && <span className="text-muted text-sm animate-pulse">Syncing...</span>}
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
                        <button
                          className="btn secondary"
                          disabled={generateReport.isPending}
                          onClick={() => handleGenerate(t.id, t.name)}
                        >
                          {generateReport.isPending ? 'Generating...' : 'Generate'}
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
              {filteredTemplates.length === 0 && !loadingTemplates && (
                <tr><td colSpan={5} className="text-center py-8 text-muted">No templates found</td></tr>
              )}
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
                    <button
                      className="btn secondary"
                      disabled={downloadReport.isPending}
                      onClick={() => handleDownload(r.id, r.name)}
                    >
                      {downloadReport.isPending ? 'Downloading...' : 'Download'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && !loadingReports && (
                <tr><td colSpan={6} className="text-center py-8 text-muted">No generated reports yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

