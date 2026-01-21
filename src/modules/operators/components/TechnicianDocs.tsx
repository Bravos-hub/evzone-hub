import { useState, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

/* ─────────────────────────────────────────────────────────────────────────────
   Technician Docs & Manuals — Document library
   RBAC: Technicians, Platform admins
───────────────────────────────────────────────────────────────────────────── */

type DocCategory = 'Safety' | 'Commissioning' | 'Diagnostics' | 'Firmware' | 'Vendor'
type DocType = 'PDF' | 'Image' | 'Doc'
type DocOwner = 'Team' | 'Me'

interface Document {
  id: string
  title: string
  cat: DocCategory
  type: DocType
  size: string
  updated: string
  owner: DocOwner
}

const MOCK_DOCS: Document[] = [
  { id: 'DOC-1201', title: 'Commissioning Checklist v2', cat: 'Commissioning', type: 'PDF', size: '240 KB', updated: '2025-10-20', owner: 'Team' },
  { id: 'DOC-1200', title: 'OCPP 1.6J Quick Ref', cat: 'Diagnostics', type: 'PDF', size: '380 KB', updated: '2025-10-18', owner: 'Me' },
  { id: 'DOC-1197', title: 'Safety — Lockout/Tagout', cat: 'Safety', type: 'PDF', size: '190 KB', updated: '2025-10-12', owner: 'Team' },
  { id: 'IMG-221', title: 'Bay wiring — CP-A1', cat: 'Diagnostics', type: 'Image', size: '1.2 MB', updated: '2025-10-10', owner: 'Me' },
  { id: 'DOC-1189', title: 'Vendor OEM-A Firmware Guide', cat: 'Firmware', type: 'Doc', size: '520 KB', updated: '2025-10-08', owner: 'Team' },
  { id: 'DOC-1185', title: 'Emergency Procedures', cat: 'Safety', type: 'PDF', size: '310 KB', updated: '2025-10-05', owner: 'Team' },
]

export function TechnicianDocs() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'TECHNICIAN_ORG'
  const canView = hasPermission(role, 'jobs', 'view')
  const canUpload = hasPermission(role, 'jobs', 'edit')

  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [type, setType] = useState('All')
  const [owner, setOwner] = useState('All')
  const [sort, setSort] = useState('Recent')
  const [view, setView] = useState<'Grid' | 'List'>('Grid')
  const [ack, setAck] = useState('')

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const filtered = useMemo(() =>
    MOCK_DOCS
      .filter(d => !q || (d.title + ' ' + d.id).toLowerCase().includes(q.toLowerCase()))
      .filter(d => category === 'All' || d.cat === category)
      .filter(d => type === 'All' || d.type === type)
      .filter(d => owner === 'All' || (owner === 'Mine' ? d.owner === 'Me' : true))
      .sort((a, b) => sort === 'Recent' ? new Date(b.updated).getTime() - new Date(a.updated).getTime() : a.title.localeCompare(b.title))
  , [q, category, type, owner, sort])

  const upload = () => {
    toast('Upload modal would open')
  }

  const share = (id: string) => {
    navigator.clipboard.writeText(`https://evzone.com/docs/${id}`)
    toast(`Share link copied for ${id}`)
  }

  const download = (id: string) => {
    toast(`Downloaded ${id}`)
  }

  if (!canView) {
    return <div className="p-8 text-center text-subtle">No permission to view Technician Docs.</div>
  }

  return (
    <div className="space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Docs & Manuals</h1>
        <div className="flex items-center gap-2">
          {canUpload && (
            <button onClick={upload} className="px-4 py-2 rounded-lg border border-border hover:bg-muted flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M20 21H4a2 2 0 0 1-2-2v-4" /></svg>
              Upload
            </button>
          )}
          <button onClick={() => setView(v => v === 'Grid' ? 'List' : 'Grid')} className="px-4 py-2 rounded-lg border border-border hover:bg-muted flex items-center gap-2">
            {view === 'Grid' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.5" /><circle cx="3.5" cy="12" r="1.5" /><circle cx="3.5" cy="18" r="1.5" /></svg>
                List view
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                Grid view
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <section className="bg-surface rounded-xl border border-border p-4 grid md:grid-cols-6 gap-3">
        <label className="relative md:col-span-2">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.6-3.6" /></svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search docs" className="w-full rounded-lg border border-border pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <select value={category} onChange={e => setCategory(e.target.value)} className="select">
          {['All', 'Safety', 'Commissioning', 'Diagnostics', 'Firmware', 'Vendor'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} className="select">
          {['All', 'PDF', 'Image', 'Doc'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={owner} onChange={e => setOwner(e.target.value)} className="select">
          {['All', 'Mine', 'Team'].map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="select">
          {['Recent', 'Name'].map(o => <option key={o}>{o}</option>)}
        </select>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Docs', value: filtered.length },
          { label: 'My Docs', value: filtered.filter(d => d.owner === 'Me').length },
          { label: 'Team Docs', value: filtered.filter(d => d.owner === 'Team').length },
          { label: 'PDF Files', value: filtered.filter(d => d.type === 'PDF').length },
        ].map(k => (
          <div key={k.label} className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <div className="text-sm text-subtle">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </div>
        ))}
      </section>

      {/* Grid View */}
      {view === 'Grid' && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(d => (
            <div key={d.id} className="rounded-xl bg-surface border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">{d.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryPill cat={d.cat} />
                    <TypePill type={d.type} />
                  </div>
                </div>
                <svg className="w-8 h-8 text-subtle flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12V8z" /><path d="M14 2v6h6" /></svg>
              </div>
              <div className="text-xs text-subtle space-y-1 mb-3">
                <div>Size: {d.size}</div>
                <div>Updated: {d.updated}</div>
                <div>Owner: {d.owner}</div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button onClick={() => download(d.id)} className="flex-1 px-3 py-1.5 rounded border border-border hover:bg-muted text-xs flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  Download
                </button>
                <button onClick={() => share(d.id)} className="flex-1 px-3 py-1.5 rounded border border-border hover:bg-muted text-xs flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L11 4" /><path d="M14 11a5 5 0 0 1-7.07 0L4.1 8.17a5 5 0 1 1 7.07-7.07L13 3" /></svg>
                  Share
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* List View */}
      {view === 'List' && (
        <section className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-subtle">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Size</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-left font-medium">Owner</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{d.title}</td>
                  <td className="px-4 py-3"><CategoryPill cat={d.cat} /></td>
                  <td className="px-4 py-3"><TypePill type={d.type} /></td>
                  <td className="px-4 py-3 text-subtle">{d.size}</td>
                  <td className="px-4 py-3 text-subtle">{d.updated}</td>
                  <td className="px-4 py-3">{d.owner}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => download(d.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Download</button>
                      <button onClick={() => share(d.id)} className="px-2 py-1 rounded border border-border hover:bg-muted text-xs">Share</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-subtle">No documents match your filters.</div>}
        </section>
      )}
    </div>
  )
}

function CategoryPill({ cat }: { cat: DocCategory }) {
  const colors: Record<DocCategory, string> = {
    Safety: 'bg-rose-100 text-rose-700',
    Commissioning: 'bg-blue-100 text-blue-700',
    Diagnostics: 'bg-emerald-100 text-emerald-700',
    Firmware: 'bg-purple-100 text-purple-700',
    Vendor: 'bg-amber-100 text-amber-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[cat]}`}>{cat}</span>
}

function TypePill({ type }: { type: DocType }) {
  const colors: Record<DocType, string> = {
    PDF: 'bg-red-100 text-red-700',
    Image: 'bg-green-100 text-green-700',
    Doc: 'bg-blue-100 text-blue-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[type]}`}>{type}</span>
}

export default TechnicianDocs

