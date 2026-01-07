import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { AddSite } from './AddSite'
import { useStations, useCreateStation } from '@/core/api/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'

import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'

/**
 * Sites Page - Site Owner feature
 */
export function Sites() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const perms = getPermissionsForFeature(user?.role, 'sites')

  const { data: stationsData, isLoading, error } = useStations()
  const createStationMutation = useCreateStation()

  const [isAdding, setIsAdding] = useState(false)
  const [q, setQ] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Map stations to sites format (sites are essentially stations grouped by location)
  const sites = useMemo(() => {
    if (!stationsData) return []
    // Group stations by location or treat each station as a site
    return stationsData.map((station) => ({
      id: station.id,
      name: station.name,
      address: station.address,
      stations: 1, // Each "site" has 1 station for now
      revenue: 0, // Revenue would come from analytics
      status: station.status === 'ACTIVE' ? 'Active' : station.status === 'INACTIVE' ? 'Inactive' : 'Pending',
    }))
  }, [stationsData])

  const filtered = useMemo(() => {
    return sites.filter((s) => (q ? (s.name + ' ' + s.address).toLowerCase().includes(q.toLowerCase()) : true))
  }, [sites, q])

  const handleAddSite = async (newSite: any) => {
    try {
      await createStationMutation.mutateAsync({
        code: newSite.code || `ST-${Date.now()}`,
        name: newSite.name,
        address: newSite.address,
        latitude: newSite.latitude || 0,
        longitude: newSite.longitude || 0,
        type: newSite.type || 'CHARGING',
      })
      setIsAdding(false)
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
    }
  }

  // Empty state or Add mode
  if (sites.length === 0 || isAdding) {
    return (
      <DashboardLayout pageTitle={sites.length === 0 ? 'Welcome to EVzone' : 'Add New Site'}>
        <div className="max-w-3xl mx-auto">
          <AddSite
            onSuccess={handleAddSite}
            onCancel={sites.length > 0 ? () => setIsAdding(false) : undefined}
            isFirstSite={sites.length === 0}
          />
        </div>
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

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card">
          <div className="text-xs text-muted">Total Sites</div>
          <div className="text-xl font-bold text-text">{isLoading ? '...' : sites.length}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Stations Hosted</div>
          <div className="text-xl font-bold text-accent">{isLoading ? '...' : sites.reduce((a, s) => a + s.stations, 0)}</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">This Month Revenue</div>
          <div className="text-xl font-bold text-ok">${isLoading ? '...' : sites.reduce((a, s) => a + s.revenue, 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sites" className="input flex-1" />
          {perms.create && (
            <button className="btn secondary" onClick={() => setIsAdding(true)}>+ Add Site</button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card mb-4">
          <div className="text-center py-8 text-muted">Loading sites...</div>
        </div>
      )}

      {/* Sites Table */}
      {!isLoading && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Address</th>
                <th>Stations</th>
                <th>Monthly Revenue</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    No sites found
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold text-text">{s.name}</td>
                    <td className="text-muted">{s.address}</td>
                    <td>{s.stations}</td>
                    <td className="font-semibold">${s.revenue.toLocaleString()}</td>
                    <td><span className={`pill ${s.status === 'Active' ? 'approved' : 'pending'}`}>{s.status}</span></td>
                    <td className="text-right">
                      <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.SITE_DETAIL(s.id))}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}

