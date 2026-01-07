import { useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

/**
 * Broadcasts Page - Admin feature
 */
export function Broadcasts() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'broadcasts')

  const [tab, setTab] = useState<'outbox' | 'templates'>('outbox')

  const mockOutbox = [
    { id: 'BC-001', subject: 'System maintenance notice', audience: 'All Users', status: 'Sent', sentAt: '2024-12-23 15:00', opens: 2450 },
    { id: 'BC-002', subject: 'New feature announcement', audience: 'Owners', status: 'Scheduled', sentAt: '2024-12-25 09:00', opens: 0 },
    { id: 'BC-003', subject: 'Holiday schedule update', audience: 'All Staff', status: 'Draft', sentAt: '—', opens: 0 },
  ]

  const mockTemplates = [
    { id: 'TPL-001', name: 'Maintenance Notice', type: 'Email', lastUsed: '2024-12-23' },
    { id: 'TPL-002', name: 'Feature Announcement', type: 'Email + Push', lastUsed: '2024-12-15' },
    { id: 'TPL-003', name: 'Urgent Alert', type: 'SMS + Push', lastUsed: '2024-12-10' },
  ]

  return (
    <DashboardLayout pageTitle="Broadcasts">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-light pb-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'outbox' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
          onClick={() => setTab('outbox')}
        >
          Outbox
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'templates' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
          onClick={() => setTab('templates')}
        >
          Templates
        </button>
      </div>

      {/* Actions */}
      {perms.create && (
        <div className="mb-4">
          <button className="btn secondary" onClick={() => alert('Compose broadcast (demo)')}>
            + New Broadcast
          </button>
        </div>
      )}

      {tab === 'outbox' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Audience</th>
                <th>Status</th>
                <th>Sent/Scheduled</th>
                <th>Opens</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockOutbox.map((b) => (
                <tr key={b.id}>
                  <td className="font-semibold text-text">{b.subject}</td>
                  <td>{b.audience}</td>
                  <td>
                    <span className={`pill ${b.status === 'Sent' ? 'approved' : b.status === 'Scheduled' ? 'pending' : 'sendback'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="text-sm">{b.sentAt}</td>
                  <td>{b.opens.toLocaleString()}</td>
                  <td className="text-right">
                    <button className="btn secondary" onClick={() => alert(`View ${b.id} (demo)`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Template</th>
                <th>Type</th>
                <th>Last Used</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockTemplates.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold text-text">{t.name}</td>
                  <td><span className="chip">{t.type}</span></td>
                  <td className="text-sm">{t.lastUsed}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button className="btn secondary" onClick={() => alert(`Use ${t.id} (demo)`)}>Use</button>
                      <button className="btn secondary" onClick={() => alert(`Edit ${t.id} (demo)`)}>Edit</button>
                    </div>
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

