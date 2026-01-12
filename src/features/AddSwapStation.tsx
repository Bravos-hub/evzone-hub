import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PATHS } from '@/app/router/paths'
import { getErrorMessage } from '@/core/api/errors'
import { useCreateStation, useStations } from '@/core/api/hooks/useStations'
import { auditLogger } from '@/core/utils/auditLogger'

export function AddSwapStation() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    siteId: '',
    name: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: sites, isLoading: loadingSites } = useStations()
  const createStationMutation = useCreateStation()

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const selectedSite = sites?.find((site) => site.id === form.siteId)
      if (!selectedSite) throw new Error('Selected site not found')

      const newStation = await createStationMutation.mutateAsync({
        code: `SW-${Date.now()}`,
        name: form.name || `${selectedSite.name} Swap Station`,
        address: selectedSite.address || '',
        latitude: selectedSite.latitude || 0,
        longitude: selectedSite.longitude || 0,
        type: 'SWAP',
        tags: ['Created via Swap Wizard'],
      })

      auditLogger.stationCreated(newStation.id, newStation.name)
      navigate(PATHS.STATIONS.SWAP_STATIONS)
    } catch (err) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  if (!loadingSites && (!sites || sites.length === 0)) {
    return (
      <DashboardLayout pageTitle="Add Swap Station">
        <div className="max-w-xl mx-auto py-12 text-center">
          <div className="bg-surface border border-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-4">No Sites Available</h2>
            <p className="text-subtle mb-6">You need to have at least one Site before you can add a Swap Station.</p>
            <button onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)} className="btn primary w-full">
              Apply for a Site / Add Site
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Add Swap Station">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-xl font-bold mb-6">Add Swap Station Wizard</h2>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="label">Select Site</label>
              <select
                className="select w-full"
                value={form.siteId}
                onChange={(e) => setForm({ ...form, siteId: e.target.value })}
              >
                <option value="">-- Choose a Site --</option>
                {sites?.map((site) => (
                  <option key={site.id} value={site.id}>{site.name} ({site.address})</option>
                ))}
              </select>
              <p className="text-xs text-subtle mt-1">
                Don't see your site? <button onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)} className="text-accent hover:underline">Add a new site</button>
              </p>
            </div>

            <div>
              <label className="label">Swap Station Name</label>
              <input
                className="input w-full"
                placeholder="e.g. Central Swap Hub"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                className="btn primary"
                disabled={!form.siteId || loading}
                onClick={handleCreate}
              >
                {loading ? 'Creating...' : 'Create Swap Station'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
