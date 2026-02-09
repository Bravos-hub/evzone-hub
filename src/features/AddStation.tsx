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

import { apiClient } from '@/core/api/client'

// ... imports

export function AddStation() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [step, setStep] = useState(0)
    const [form, setForm] = useState({
        siteId: '',
        name: '',
        type: 'AC',
        chargePointCount: 1,
        // New Fields
        price: 0,
        rating: 5,
        amenities: '',
        images: [] as string[],
        open247: true
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploadingImage(true)
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)
        // Temporary ID logic or use a consistent temp ID, or just 'station-upload'
        const tempCode = `ST-${Date.now()}`
        formData.append('entityType', 'STATION')
        formData.append('entityId', tempCode)
        formData.append('category', 'SITE_PHOTOS')

        try {
            // Assuming post returns { fileUrl: ... } or similar based on Service
            // Validating response type might be needed, but assuming standard return
            const res = await apiClient.post<any>('/documents', formData) // Using any for quick integration
            if (res && res.fileUrl) {
                setForm(prev => ({ ...prev, images: [...prev.images, res.fileUrl] }))
            }
        } catch (err) {
            console.error('Upload failed', err)
            setError('Image upload failed')
        } finally {
            setUploadingImage(false)
        }
    }

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
                siteId: form.siteId,
                orgId: user?.orgId || user?.organizationId,
                ownerId: user?.id,
                // New Fields
                price: form.price,
                rating: form.rating,
                open247: form.open247,
                amenities: JSON.stringify(form.amenities.split(',').map(s => s.trim()).filter(Boolean)),
                images: JSON.stringify(form.images)
            })

            auditLogger.stationCreated(newStation.id, newStation.name)

            // Redirect to Stations list (Decoupled flow per user request)
            navigate(PATHS.STATIONS.ROOT)
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Station Name</label>
                                <input
                                    className="input w-full"
                                    placeholder="e.g. North Wing Station"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Price per kWh ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input w-full"
                                    placeholder="0.00"
                                    value={form.price}
                                    onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="label">Rating (Initial)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    max="5"
                                    className="input w-full"
                                    placeholder="5.0"
                                    value={form.rating}
                                    onChange={e => setForm({ ...form, rating: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center pt-8">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={form.open247}
                                        onChange={e => setForm({ ...form, open247: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Open 24/7</span>
                                </label>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div>
                            <label className="label">Amenities (Comma separated)</label>
                            <input
                                className="input w-full"
                                placeholder="Wifi, Cafe, Restroom"
                                value={form.amenities}
                                onChange={e => setForm({ ...form, amenities: e.target.value })}
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="label">Station Images</label>
                            <div className="flex gap-4 items-center">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="file-input w-full max-w-xs"
                                    onChange={handleImageUpload}
                                    disabled={loading}
                                />
                                {uploadingImage && <span className="loading loading-spinner loading-sm"></span>}
                            </div>
                            {form.images.length > 0 && (
                                <div className="flex gap-2 mt-2 overflow-x-auto">
                                    {form.images.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded overflow-hidden border">
                                            <img src={img} alt="station" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                className="btn primary"
                                disabled={!form.siteId || loading || uploadingImage}
                                onClick={handleCreate}
                            >
                                {loading ? 'Creating...' : 'Create Station'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
