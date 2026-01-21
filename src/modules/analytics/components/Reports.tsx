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

const mockTemplates: ReportTemplate[] = [
  { id: 'TPL-001', name: 'Monthly Revenue Summary', type: 'Revenue', description: 'Revenue breakdown by station and region', lastGenerated: '2024-12-01', frequency: 'Monthly' },
  { id: 'TPL-002', name: 'Session Analytics', type: 'Sessions', description: 'Session counts, durations, and completion rates', lastGenerated: '2024-12-24', frequency: 'Weekly' },
  { id: 'TPL-003', name: 'Station Utilization', type: 'Utilization', description: 'Utilization percentages and peak hours', lastGenerated: '2024-12-23', frequency: 'Daily' },
  { id: 'TPL-004', name: 'Incident Report', type: 'Incidents', description: 'All incidents with resolution times', lastGenerated: '2024-12-24', frequency: 'On-demand' },
  { id: 'TPL-005', name: 'Compliance Audit', type: 'Compliance', description: 'Regulatory compliance status', lastGenerated: '2024-11-30', frequency: 'Monthly' },
]

const mockReports: GeneratedReport[] = [
  { id: 'RPT-001', name: 'November Revenue Summary', type: 'Revenue', format: 'PDF', generatedAt: '2024-12-01 09:00', size: '2.4 MB', generatedBy: 'System' },
  { id: 'RPT-002', name: 'Week 51 Sessions', type: 'Sessions', format: 'Excel', generatedAt: '2024-12-24 06:00', size: '1.1 MB', generatedBy: 'System' },
  { id: 'RPT-003', name: 'Daily Utilization Dec 23', type: 'Utilization', format: 'CSV', generatedAt: '2024-12-24 00:05', size: '450 KB', generatedBy: 'System' },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reports Page - Unified for all roles
 * 
 * RBAC Controls:
 * - viewAll: ADMIN, OPERATOR see all reports
 * - export: ADMIN, OPERATOR, OWNER can export
 * - schedule: ADMIN, OPERATOR can schedule
 */
export function Reports() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'reports')

  const [tab, setTab] = useState<'templates' | 'generated'>('templates')
  const [typeFilter, setTypeFilter] = useState<ReportType | 'All'>('All')

  const filteredTemplates = mockTemplates.filter((t) => (typeFilter === 'All' ? true : t.type === typeFilter))
  const filteredReports = mockReports.filter((r) => (typeFilter === 'All' ? true : r.type === typeFilter))

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

