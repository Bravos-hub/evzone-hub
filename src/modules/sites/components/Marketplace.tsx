import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

type ListingKind = 'Operators' | 'Sites' | 'Technicians'

type Listing = {
  id: string
  kind: ListingKind
  name: string
  region: string
  city: string
  capacity?: number
  skills?: string[]
  rating?: number
}

const mockListings: Listing[] = [
  { id: 'OP-001', kind: 'Operators', name: 'VoltOps Ltd', region: 'AFRICA', city: 'Kampala', capacity: 200 },
  { id: 'OP-002', kind: 'Operators', name: 'GridManaged', region: 'EUROPE', city: 'Berlin', capacity: 120 },
  { id: 'SITE-101', kind: 'Sites', name: 'City Mall Rooftop', region: 'AFRICA', city: 'Kampala', capacity: 5 },
  { id: 'SITE-203', kind: 'Sites', name: 'Tech Park Lot', region: 'AFRICA', city: 'Nairobi', capacity: 8 },
  { id: 'TECH-11', kind: 'Technicians', name: 'AmpCrew Techs', region: 'AFRICA', city: 'Nairobi', skills: ['OCPP', 'HVAC'], rating: 4.7 },
  { id: 'TECH-22', kind: 'Technicians', name: 'Partner-X', region: 'EUROPE', city: 'Berlin', skills: ['Battery', 'Swap'], rating: 4.5 },
]

export function Marketplace() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'marketplace' as any) // permissive; adjust if added to permissions

  const [kind, setKind] = useState<ListingKind | 'All'>('All')
  const [region, setRegion] = useState<'ALL' | string>('ALL')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return mockListings
      .filter((l) => (kind === 'All' ? true : l.kind === kind))
      .filter((l) => (region === 'ALL' ? true : l.region === region))
      .filter((l) => (q ? (l.name + ' ' + l.city).toLowerCase().includes(q.toLowerCase()) : true))
  }, [kind, region, q])

  return (
    <DashboardLayout pageTitle="Marketplace">
      <div className="space-y-4">
        <div className="card grid md:grid-cols-4 gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or city" className="input md:col-span-2" />
          <select value={kind} onChange={(e) => setKind(e.target.value as ListingKind | 'All')} className="select">
            {['All', 'Operators', 'Sites', 'Technicians'].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="select">
            {['ALL', 'AFRICA', 'EUROPE', 'AMERICAS', 'ASIA', 'MIDDLE_EAST'].map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All regions' : r}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.map((l) => (
            <div key={l.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted">{l.id}</div>
                  <div className="text-lg font-semibold">{l.name}</div>
                </div>
                <span className="pill">{l.kind}</span>
              </div>
              <div className="text-sm text-muted">
                {l.city} • {l.region}
              </div>
              {l.capacity !== undefined && <div className="text-sm text-muted">Capacity: {l.capacity}</div>}
              {l.skills && (
                <div className="text-sm text-muted">
                  Skills: {l.skills.join(', ')}
                </div>
              )}
              {l.rating && <div className="text-sm text-muted">Rating: {l.rating.toFixed(1)} / 5</div>}
              <div className="flex items-center gap-2">
                <button className="btn secondary" onClick={() => alert('Open listing (mock)')}>
                  Open
                </button>
                {perms?.create && (
                  <button className="btn secondary" onClick={() => alert('Contact (mock)')}>
                    Contact
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

