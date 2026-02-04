import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useCreateStation } from '@/modules/stations/hooks/useStations'
import { getErrorMessage } from '@/core/api/errors'
import { auditLogger } from '@/core/utils/auditLogger'
import { PATHS } from '@/app/router/paths'

import { useAuthStore } from '@/core/auth/authStore'
import { useSites } from '@/modules/sites/hooks/useSites'
import { useTenantSites } from '@/modules/tenants/hooks/useTenantDashboard'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'

export function AddStation() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [step, setStep] = useState(0)
    const [form, setForm] = useState({
        siteId: '',
        name: '',
        type: 'AC',
        chargePointCount: 1,
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Fetch User's Sites (Owned + Leased)
    const { data: sitesData, isLoading: loadingOwned } = useSites()
    const { data: leasedSitesData, isLoading: loadingLeased } = useTenantSites()

    const loadingSites = loadingOwned || loadingLeased

    // Filter and combine sites
    const availableSites = [
        ...(sitesData?.filter(s => {
            if (!user) return false
            if (isInGroup(user.role, ROLE_GROUPS.PLATFORM_ADMINS)) return true
            return s.ownerId === user.id
        }) || []),
        ...(leasedSitesData?.map(lease => ({
            id: lease.siteId,
            name: lease.siteName,
            address: lease.address,
            latitude: 0, // Lease object might not have coords, fallback
            longitude: 0
        })) || [])
    ]
    const createStationMutation = useCreateStation()

    const handleCreate = async () => {
        setLoading(true)
        setError('')
        try {
            const selectedSite = availableSites?.find(s => s.id === form.siteId)
            if (!selectedSite) throw new Error('Selected site not found')

            // Create the station
            const newStation = await createStationMutation.mutateAsync({
                code: `ST-${Date.now()}`,
                name: form.name || `${selectedSite.name} Station`,
                address: selectedSite.address || '',
                latitude: Number(selectedSite.latitude) || 0,
                longitude: Number(selectedSite.longitude) || 0,
                type: 'CHARGING',
                tags: ['Created via Wizard'],
            })

            auditLogger.stationCreated(newStation.id, newStation.name)

            // Redirect to Add Charger for this station
            navigate(`/add-charger?stationId=${newStation.id}`)
        } catch (err) {
            setError(getErrorMessage(err))
            setLoading(false)
        }
    }

    // If no sites, redirect flow
    if (!loadingSites && availableSites.length === 0) {
        return (
            <DashboardLayout pageTitle="Add Station">
                <div className="max-w-xl mx-auto py-12 text-center">
                    <div className="bg-surface border border-border rounded-xl p-8">
                        <h2 className="text-xl font-bold mb-4">No Sites Available</h2>
                        <p className="text-subtle mb-6">You need to have at least one Site (Owned or Leased) before you can add a Station.</p>
                        <button onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)} className="btn primary w-full">
                            Apply for a Site / Add Site
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout pageTitle="Add New Station">
            <div className="max-w-2xl mx-auto">
                <div className="card">
                    <h2 className="text-xl font-bold mb-6">Add Station Wizard</h2>

                    {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

                    <div className="space-y-4">
                        {/* Step 1: Select Site */}
                        <div>
                            <label className="label">Select Site</label>
                            <select
                                className="select w-full"
                                value={form.siteId}
                                onChange={e => setForm({ ...form, siteId: e.target.value })}
                            >
                                <option value="">-- Choose a Site --</option>
                                {availableSites.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.address})</option>
                                ))}
                            </select>
                            <p className="text-xs text-subtle mt-1">
                                Don't see your site? <button onClick={() => navigate(PATHS.SITE_OWNER.APPLY_FOR_SITE)} className="text-accent hover:underline">Add a new site</button>
                            </p>
                        </div>

                        {/* Step 2: Station Basic Info */}
                        <div>
                            <label className="label">Station Name</label>
                            <input
                                className="input w-full"
                                placeholder="e.g. North Wing Station"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                className="btn primary"
                                disabled={!form.siteId || loading}
                                onClick={handleCreate}
                            >
                                {loading ? 'Creating...' : 'Create & Add Chargers'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
