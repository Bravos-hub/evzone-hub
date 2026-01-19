import { useState, useEffect } from 'react'
import type { Site } from '@/core/api/types'

type SiteEditModalProps = {
    open: boolean
    site: Site
    onConfirm: (data: { powerCapacityKw: number; parkingBays: number }) => void
    onCancel: () => void
    loading?: boolean
}

export function SiteEditModal({
    open,
    site,
    onConfirm,
    onCancel,
    loading = false,
}: SiteEditModalProps) {
    const [capacity, setCapacity] = useState(site.powerCapacityKw || 0)
    const [parkingBays, setParkingBays] = useState(site.parkingBays || 0)

    useEffect(() => {
        if (open) {
            setCapacity(site.powerCapacityKw || 0)
            setParkingBays(site.parkingBays || 0)
        }
    }, [open, site])

    if (!open) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirm({ powerCapacityKw: capacity, parkingBays })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-panel border border-border-light rounded-xl p-6 shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold text-text mb-6">Edit Site Details</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            Power Capacity (kW)
                        </label>
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(Number(e.target.value))}
                            className="input w-full"
                            placeholder="e.g. 150"
                            required
                            min="0"
                        />
                        <p className="text-[10px] text-muted mt-1">Total power capacity available at the site.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted mb-1">
                            Parking Bays
                        </label>
                        <input
                            type="number"
                            value={parkingBays}
                            onChange={(e) => setParkingBays(Number(e.target.value))}
                            className="input w-full"
                            placeholder="e.g. 10"
                            required
                            min="0"
                        />
                        <p className="text-[10px] text-muted mt-1">Number of dedicated parking spots for EV charging.</p>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            type="button"
                            className="btn secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn bg-accent text-white hover:bg-accent/90"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
