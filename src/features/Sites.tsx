import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { AddSite } from './AddSite'
import { useStations, useCreateStation } from '@/core/api/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'

import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'

type Tab = 'Owned' | 'Rented'

/**
 * Sites Page - Site Owner & Station Owner feature
 */
export function Sites() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const perms = getPermissionsForFeature(user?.role, 'sites')

  const { data: stationsData, isLoading, error } = useStations()
  const createStationMutation = useCreateStation()

  const [activeTab, setActiveTab] = useState<Tab>('Owned')
  const [isAdding, setIsAdding] = useState(false)
  const [q, setQ] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Map stations to sites format
  // Simulate "Owned" vs "Rented" based on status or some property for demo
  const sites = useMemo(() => {
    if (!stationsData) return []
    return stationsData.map((station) => {
      // Logic simulation: If status is 'INACTIVE', treat as 'Rented' for demo purposes
      // In real app, this would be `station.ownershipType`
      const isRented = station.status === 'INACTIVE'
      return {
        id: station.id,
        name: station.name,
        address: station.address,
        stations: 1,
        revenue: Math.floor(Math.random() * 5000),
        status: station.status === 'ACTIVE' ? 'Active' : station.status === 'INACTIVE' ? 'Pending' : 'Leased',
        type: isRented ? 'Rented' : 'Owned' as Tab
      }
    })
  }, [stationsData])

  const filtered = useMemo(() => {
    return sites
      .filter((s) => s.type === activeTab)
      .filter((s) => (q ? (s.name + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true))
  }, [sites, q, activeTab])

  const handleAddSite = async (newSite: any) => {
    try {
      const station = await createStationMutation.mutateAsync({
        code: newSite.code || `ST-${Date.now()}`,
        name: newSite.name,
        address: newSite.address,
        latitude: parseFloat(newSite.latitude) || 0,
        longitude: parseFloat(newSite.longitude) || 0,
        type: newSite.type || 'CHARGING',
        tags: newSite.tags || [],
      })
      const { auditLogger } = await import('@/core/utils/auditLogger')
      auditLogger.stationCreated(station.id, station.name)
      setIsAdding(false)
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    }
  }

  // Handle Loading
  if (isLoading) {
    return <DashboardLayout pageTitle="My Sites"><div className="text-center py-12">Loading...</div></DashboardLayout>
  }

  // Handle Add Site Modal Mode
  if (isAdding) {
    return (
      <DashboardLayout pageTitle="Add New Site">
        <AddSite onSuccess={handleAddSite} onCancel={() => setIsAdding(false)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="My Sites">
      {/* Error Message */}
      {(error || errorMessage) && (
        <div className="card mb-4 bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {errorMessage || (error ? getErrorMessage(error) : 'An error occurred')}
          </div>
        </div>
      )}

      {/* Stats Summary (Filtered by Tab) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card">
          <div className="text-xs text-muted">Sites ({activeTab})</div>
          <div className="text-xl font-bold text-text">{filtered.length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Stations Hosted</div>
          <div className="text-xl font-bold text-accent">{filtered.reduce((a, s) => a + s.stations, 0)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Est. Revenue</div>
          <div className="text-xl font-bold text-ok">${filtered.reduce((a, s) => a + s.revenue, 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs and Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex p-1 bg-surface border border-white/5 rounded-xl">
          {(['Owned', 'Rented'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-text'
                }`}
            >
              {tab} Sites
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full sm:w-auto">
          {activeTab === 'Owned' ? (
            <button
              className="btn primary"
              onClick={() => setIsAdding(true)}
            >
              + Add Site
            </button>
          ) : (
            <button
              className="btn primary"
              onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)}
            >
              Apply for Site
            </button>
          )}
        </div>
      </div>

      {/* Sites Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Address</th>
              <th>Stations</th>
              <th>Revenue/Cost</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-muted">No {activeTab.toLowerCase()} sites found.</div>
                    {activeTab === 'Owned' ? (
                      <button className="text-accent font-medium hover:underline" onClick={() => setIsAdding(true)}>Add your first site</button>
                    ) : (
                      <button className="text-accent font-medium hover:underline" onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)}>Apply for a site</button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-text">{s.name}</td>
                  <td className="text-muted">{s.address}</td>
                  <td>{s.stations}</td>
                  <td className="font-semibold">
                    {activeTab === 'Owned' ? (
                      <span className="text-ok">+${s.revenue.toLocaleString()}</span>
                    ) : (
                      <span className="text-amber-500">-${(s.revenue * 0.8).toLocaleString()}</span>
                    )}
                  </td>
                  <td>
                    <span className={`pill ${s.status === 'Active' ? 'approved' : 'pending'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.SITE_DETAIL(s.id))}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
