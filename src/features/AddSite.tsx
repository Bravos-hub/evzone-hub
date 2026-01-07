import { useState } from 'react'
import { Link } from 'react-router-dom'

export type SiteForm = {
    name: string
    address: string
    city: string
    power: string
    bays: string
    lease: string
    footfall: string
    monthlyPrice: string
    latitude: string
    longitude: string
    photos: File[]
    amenities: Set<string>
}

const Bolt = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
)

const AMENITIES = ['Security', 'Lighting', 'Coffee', 'Restrooms', 'Shelter']

interface AddSiteProps {
    onSuccess?: (site: SiteForm) => void
    onCancel?: () => void
    isOnboarding?: boolean
    isFirstSite?: boolean
}

export function AddSite({ onSuccess, onCancel, isOnboarding = false, isFirstSite = false }: AddSiteProps) {
    const [form, setForm] = useState<SiteForm>({
        name: '',
        address: '',
        city: 'Kampala',
        power: '150',
        bays: '10',
        lease: 'Revenue share',
        footfall: 'Medium',
        monthlyPrice: '',
        latitude: '',
        longitude: '',
        photos: [],
        amenities: new Set(['Security', 'Lighting']),
    })
    const [error, setError] = useState('')
    const [ack, setAck] = useState('')

    const update = <K extends keyof SiteForm>(key: K, value: SiteForm[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }))
        setError('')
        setAck('')
    }

    const toggleAmenity = (value: string) => {
        setForm((prev) => {
            const next = new Set(prev.amenities)
            next.has(value) ? next.delete(value) : next.add(value)
            return { ...prev, amenities: next }
        })
        setError('')
        setAck('')
    }

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.')
            return
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                }))
                setAck('Location detected successfully.')
            },
            () => {
                setError('Unable to retrieve your location.')
            }
        )
    }

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newPhotos = Array.from(e.target.files)
            setForm((prev) => ({ ...prev, photos: [...prev.photos, ...newPhotos] }))
            setAck(`Added ${newPhotos.length} photo(s).`)
        }
    }

    const removePhoto = (index: number) => {
        setForm((prev) => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index),
        }))
    }

    const validate = () => {
        if (form.name.trim().length < 3) return 'Please enter a site name (3+ chars).'
        if (form.address.trim().length < 5) return 'Please enter a valid address.'
        if (Number.isNaN(Number(form.power)) || Number(form.power) <= 0) return 'Power capacity must be a positive number.'
        if (Number.isNaN(Number(form.bays)) || Number(form.bays) <= 0) return 'Parking bays must be a positive number.'
        if (form.monthlyPrice && (Number.isNaN(Number(form.monthlyPrice)) || Number(form.monthlyPrice) < 0)) return 'Monthly price must be a valid amount.'
        return ''
    }

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const err = validate()
        if (err) {
            setError(err)
            return
        }
        setError('')
        setAck('Saved successfully.')
        if (onSuccess) onSuccess(form)
    }

    return (
        <div className={`${isOnboarding ? '' : 'bg-surface rounded-2xl border border-border p-8 shadow-lg'}`}>
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
                        <Bolt className="w-6 h-6" />
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight">{(isOnboarding || isFirstSite) ? 'Add Your First Site' : 'Add New Site'}</h2>
                </div>
                <p className="text-subtle">Enter the location and capacity details for your electric vehicle charging site.</p>
            </div>

            <form className="space-y-6" onSubmit={submit} noValidate>
                {(error || ack) && (
                    <div role="alert" aria-live="polite" className={`text-sm font-medium p-3 rounded-lg flex items-center gap-2 ${error ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {error ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            )}
                        </svg>
                        {error || ack}
                    </div>
                )}

                <div className="grid sm:grid-cols-2 gap-5">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Site name</span>
                        <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input bg-background" placeholder="e.g. City Mall Rooftop" />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">City</span>
                        <input value={form.city} onChange={(e) => update('city', e.target.value)} className="input bg-background" placeholder="Kampala" />
                    </label>
                    <label className="flex flex-col gap-2 sm:col-span-2">
                        <span className="text-sm font-semibold">Address</span>
                        <input value={form.address} onChange={(e) => update('address', e.target.value)} className="input bg-background" placeholder="Street name, District, Floor..." />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Power capacity (kW)</span>
                        <input type="number" value={form.power} onChange={(e) => update('power', e.target.value)} className="input bg-background" />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Parking bays</span>
                        <input type="number" value={form.bays} onChange={(e) => update('bays', e.target.value)} className="input bg-background" />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Lease type</span>
                        <select value={form.lease} onChange={(e) => update('lease', e.target.value)} className="select bg-background font-medium">
                            {['Revenue share', 'Fixed rent'].map((o) => (
                                <option key={o}>{o}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Expected Monthly Price ($)</span>
                        <input type="number" value={form.monthlyPrice} onChange={(e) => update('monthlyPrice', e.target.value)} className="input bg-background" placeholder="Optional" />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Expected Footfall</span>
                        <select value={form.footfall} onChange={(e) => update('footfall', e.target.value)} className="select bg-background font-medium">
                            {['Low', 'Medium', 'High', 'Very high'].map((o) => (
                                <option key={o}>{o}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Location Coordinates</h3>
                        <button type="button" onClick={handleGeolocation} className="text-xs btn secondary flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Use my current location
                        </button>
                    </div>
                    <label className="flex flex-col gap-2">
                        <span className="text-xs text-muted">Latitude</span>
                        <input value={form.latitude} onChange={(e) => update('latitude', e.target.value)} className="input bg-background" placeholder="e.g. 0.3476" />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-xs text-muted">Longitude</span>
                        <input value={form.longitude} onChange={(e) => update('longitude', e.target.value)} className="input bg-background" placeholder="e.g. 32.5825" />
                    </label>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Site Photos</h3>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/20 transition-colors">
                        <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                        <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-sm font-medium text-accent">Click to upload photos</span>
                            <span className="text-xs text-muted">or drag and drop</span>
                        </label>
                    </div>
                    {form.photos.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {form.photos.map((file, i) => (
                                <div key={i} className="relative group aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted font-medium bg-surface/50">
                                        {file.name.slice(0, 6)}...
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <fieldset className="p-0 border-none m-0">
                    <legend className="text-sm font-semibold mb-3">Available Amenities</legend>
                    <div className="flex flex-wrap gap-2">
                        {AMENITIES.map((a) => (
                            <label
                                key={a}
                                className={`cursor-pointer transition-all text-xs font-bold px-4 py-2 rounded-xl border-2 flex items-center gap-2 ${form.amenities.has(a)
                                    ? 'bg-accent/10 border-accent text-accent shadow-sm'
                                    : 'bg-muted/30 border-border text-subtle hover:border-subtle/30'
                                    }`}
                            >
                                <input type="checkbox" className="sr-only" checked={form.amenities.has(a)} onChange={() => toggleAmenity(a)} />
                                {form.amenities.has(a) && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                {a}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                    {isOnboarding ? (
                        <Link to="/onboarding/site-owner" className="flex-1 text-center py-3 rounded-xl border-2 border-border font-bold hover:bg-muted transition-all">
                            Back
                        </Link>
                    ) : (
                        onCancel && (
                            <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border-2 border-border font-bold hover:bg-muted transition-all">
                                Cancel
                            </button>
                        )
                    )}
                    <button type="submit" className="flex-[2] py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-md active:scale-[0.98]">
                        {isOnboarding ? 'Create Site & Continue' : 'Create Parking Site'}
                    </button>
                </div>
            </form>
        </div>
    )
}
