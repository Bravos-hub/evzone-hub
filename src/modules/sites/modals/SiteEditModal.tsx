import { useState, useEffect } from 'react'
import type { Site } from '@/core/api/types'
import { uploadImagesToCloudinary, validateImageFile } from '@/core/utils/cloudinary'

type SiteEditModalProps = {
    open: boolean
    site: Site
    onConfirm: (data: { powerCapacityKw: number; parkingBays: number; photos: string[] }) => void
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
    const [photos, setPhotos] = useState<string[]>(site.photos || [])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')

    useEffect(() => {
        if (open) {
            setCapacity(site.powerCapacityKw || 0)
            setParkingBays(site.parkingBays || 0)
            setPhotos(site.photos || [])
            setUploadError('')
        }
    }, [open, site])

    if (!open) return null

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        const files = Array.from(e.target.files)

        for (const file of files) {
            const validation = validateImageFile(file)
            if (!validation.valid) {
                setUploadError(validation.error || 'Invalid file')
                return
            }
        }

        try {
            setIsUploading(true)
            setUploadError('')
            const urls = await uploadImagesToCloudinary(files)
            setPhotos(prev => [...prev, ...urls])
        } catch (err) {
            setUploadError('Failed to upload images. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirm({ powerCapacityKw: capacity, parkingBays, photos })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-panel border border-border-light rounded-xl p-6 shadow-xl max-w-2xl w-full mx-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto text-text">
                <h3 className="text-xl font-bold mb-6">Edit Site Details</h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
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
                            <p className="text-[10px] text-muted mt-1">Total power capacity available.</p>
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
                            <p className="text-[10px] text-muted mt-1">Dedicated charging spots.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted">Site Photos</label>
                            <span className="text-xs text-muted">{photos.length} photos</span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {photos.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border-light group">
                                    <img src={url} className="w-full h-full object-cover" alt="" />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" stroke="currentColor" /></svg>
                                    </button>
                                </div>
                            ))}

                            <label className="aspect-square rounded-lg border-2 border-dashed border-border-light hover:border-accent flex flex-col items-center justify-center cursor-pointer bg-muted/5 transition-colors">
                                <input type="file" multiple className="hidden" onChange={handlePhotoUpload} accept="image/*" disabled={isUploading} />
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <svg className="w-6 h-6 text-muted mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" stroke="currentColor" /></svg>
                                        <span className="text-[10px] font-medium text-muted">Add</span>
                                    </>
                                )}
                            </label>
                        </div>
                        {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            type="button"
                            className="btn secondary"
                            onClick={onCancel}
                            disabled={loading || isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn bg-accent text-white hover:bg-accent/90"
                            disabled={loading || isUploading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
