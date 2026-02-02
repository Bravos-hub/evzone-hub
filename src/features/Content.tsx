import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { PERMISSIONS, hasPermission } from '@/constants/permissions'
import { useContent } from '@/modules/content/useContent'
import { getErrorMessage } from '@/core/api/errors'

/* ─────────────────────────────────────────────────────────────────────────────
   Content Management — Pages, Announcements, Docs, Help articles, Media
   RBAC: Platform admins only
───────────────────────────────────────────────────────────────────────────── */

type ContentType = 'Page' | 'Announcement' | 'Doc' | 'Help' | 'Media'
type ContentState = 'Draft' | 'Scheduled' | 'Published' | 'Archived'
type Locale = 'EN' | 'FR' | 'ES' | 'SW' | 'AR' | 'ZH'

interface ContentRow {
  id: string
  title: string
  type: ContentType
  locale: Locale
  updated: string
  state: ContentState
  author: string
}

const mapState = (state?: string): ContentState => {
  switch ((state || '').toLowerCase()) {
    case 'published':
      return 'Published'
    case 'scheduled':
      return 'Scheduled'
    case 'archived':
      return 'Archived'
    case 'draft':
    default:
      return 'Draft'
  }
}

const mapType = (type?: string): ContentType => {
  switch ((type || '').toLowerCase()) {
    case 'announcement':
      return 'Announcement'
    case 'doc':
    case 'document':
      return 'Doc'
    case 'help':
      return 'Help'
    case 'media':
      return 'Media'
    case 'page':
    default:
      return 'Page'
  }
}

const mapLocale = (locale?: string): Locale => {
  const value = (locale || '').toUpperCase()
  if (value === 'FR' || value === 'ES' || value === 'SW' || value === 'AR' || value === 'ZH') {
    return value as Locale
  }
  return 'EN'
}

export function Content() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'EVZONE_OPERATOR'

  const canView = hasPermission(role, 'content', 'view')
  const canEdit = hasPermission(role, 'content', 'edit')

  const [type, setType] = useState<'All' | ContentType>('All')
  const [state, setState] = useState<'All' | ContentState>('All')
  const [locale, setLocale] = useState<'All' | Locale>('All')
  const [q, setQ] = useState('')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const { data: contentData = [], isLoading, error } = useContent()

  const rows = useMemo<ContentRow[]>(() => {
    const raw = Array.isArray(contentData) ? contentData : (contentData as any)?.data || []
    return raw.map((item: any) => ({
      id: item.id,
      title: item.title || item.name || '—',
      type: mapType(item.type || item.kind),
      locale: mapLocale(item.locale || item.language),
      updated: item.updatedAt || item.updated || item.modifiedAt || '—',
      state: mapState(item.status || item.state),
      author: item.author || item.updatedBy || item.createdBy || '—',
    }))
  }, [contentData])

  const filtered = useMemo(() =>
    rows
      .filter(r => !q || (r.title + ' ' + r.id).toLowerCase().includes(q.toLowerCase()))
      .filter(r => type === 'All' || r.type === type)
      .filter(r => state === 'All' || r.state === state)
      .filter(r => locale === 'All' || r.locale === locale)
  , [rows, q, type, state, locale])

  const kpis = useMemo(() => {
    const published = rows.filter(r => r.state === 'Published').length
    const drafts = rows.filter(r => r.state === 'Draft').length
    const scheduled = rows.filter(r => r.state === 'Scheduled').length
    const locales = new Set(rows.map(r => r.locale)).size
    const media = rows.filter(r => r.type === 'Media').length
    return [
      { label: 'Published', value: String(published) },
      { label: 'Drafts', value: String(drafts) },
      { label: 'Scheduled', value: String(scheduled) },
      { label: 'Locales', value: String(locales) },
      { label: 'Media items', value: String(media) },
    ]
  }, [rows])

  if (!canView) {
    return (
      <div className="p-8 text-center text-subtle">
        You do not have permission to view the Content Manager.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {ack && (
        <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">
          {getErrorMessage(error)}
        </div>
      )}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-6 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search title / ID"
            className="input pl-9"
          />
        </label>
        <select value={type} onChange={e => setType(e.target.value as any)} className="select">
          {['All', 'Page', 'Announcement', 'Doc', 'Help', 'Media'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={state} onChange={e => setState(e.target.value as any)} className="select">
          {['All', 'Draft', 'Scheduled', 'Published', 'Archived'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={locale} onChange={e => setLocale(e.target.value as any)} className="select">
          {['All', 'EN', 'FR', 'ES', 'SW', 'AR', 'ZH'].map(o => <option key={o}>{o}</option>)}
        </select>
        <button
          onClick={() => toast('Exported CSV (demo)')}
          className="btn secondary flex items-center gap-2 justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
          </svg>
          Export
        </button>
      </section>

      {/* Content table */}
      <section className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-muted text-subtle">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Locale</th>
              <th className="px-4 py-3 text-left font-medium">Updated</th>
              <th className="px-4 py-3 text-left font-medium">State</th>
              <th className="px-4 py-3 text-left font-medium">Author</th>
              {canEdit && <th className="px-4 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={canEdit ? 8 : 7} className="p-8 text-center text-subtle">Loading content...</td>
              </tr>
            )}
            {!isLoading && filtered.map(r => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-4 py-3 text-subtle">{r.id}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted">{r.type}</span>
                </td>
                <td className="px-4 py-3">{r.locale}</td>
                <td className="px-4 py-3 text-subtle">{r.updated}</td>
                <td className="px-4 py-3">
                  <StatePill state={r.state} />
                </td>
                <td className="px-4 py-3 text-subtle">{r.author}</td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {r.state !== 'Published' && (
                        <button onClick={() => toast(`Published ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">
                          Publish
                        </button>
                      )}
                      {r.state === 'Published' && (
                        <button onClick={() => toast(`Unpublished ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">
                          Unpublish
                        </button>
                      )}
                      <button onClick={() => toast(`Editing ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">
                        Edit
                      </button>
                      <button onClick={() => toast(`Archived ${r.id}`)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs text-red-600">
                        Archive
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-subtle">No content matches your filters.</div>
        )}
      </section>
    </div>
  )
}

function StatePill({ state }: { state: ContentState }) {
  const colors: Record<ContentState, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Scheduled: 'bg-amber-100 text-amber-700',
    Published: 'bg-emerald-100 text-emerald-700',
    Archived: 'bg-slate-100 text-slate-500',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[state]}`}>{state}</span>
}

export default Content

