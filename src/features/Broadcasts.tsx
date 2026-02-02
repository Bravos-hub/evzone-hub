import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { useNotices } from '@/modules/notifications/hooks/useNotices'
import { useNoticeTemplates } from '@/modules/notifications/hooks/useNoticeTemplates'
import { getErrorMessage } from '@/core/api/errors'
import { LoadingRow } from '@/ui/components/SkeletonCards'

/**
 * Broadcasts Page - Admin feature
 */
export function Broadcasts() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'broadcasts')

  const [tab, setTab] = useState<'outbox' | 'templates'>('outbox')

  const { data: noticesData = [], isLoading: noticesLoading, error: noticesError } = useNotices()
  const { data: templatesData = [], isLoading: templatesLoading, error: templatesError } = useNoticeTemplates()

  const outbox = useMemo(() => {
    const raw = Array.isArray(noticesData) ? noticesData : (noticesData as any)?.data || []
    return raw.map((n: any) => ({
      id: n.id,
      subject: n.message || n.type || '—',
      audience: n.tenantName || n.tenantId || 'All',
      status: n.status === 'sent' ? 'Sent' : n.status === 'pending' ? 'Scheduled' : 'Draft',
      sentAt: n.sentAt || n.createdAt || '—',
      opens: n.opens ?? n.metadata?.opens ?? 0,
    }))
  }, [noticesData])

  const templates = useMemo(() => {
    const raw = Array.isArray(templatesData) ? templatesData : (templatesData as any)?.data || []
    return raw.map((t: any) => ({
      id: t.id,
      name: t.name || t.title || '—',
      type: t.type || 'Email',
      lastUsed: t.lastUsedAt || '—',
    }))
  }, [templatesData])
  return (
    <DashboardLayout pageTitle="Broadcasts">
      {(noticesError || templatesError) && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">{getErrorMessage(noticesError || templatesError)}</div>
        </div>
      )}
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
              {noticesLoading && <LoadingRow colSpan={6} />}
              {!noticesLoading && outbox.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">No broadcasts found.</td>
                </tr>
              )}
              {!noticesLoading && outbox.map((b) => (
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
              {templatesLoading && <LoadingRow colSpan={4} />}
              {!templatesLoading && templates.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted">No templates found.</td>
                </tr>
              )}
              {!templatesLoading && templates.map((t) => (
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

