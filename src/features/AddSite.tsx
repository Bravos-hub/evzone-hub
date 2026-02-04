import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { uploadImagesToCloudinary, validateImageFile } from '@/core/utils/cloudinary'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { useUsers } from '@/modules/auth/hooks/useUsers'
import { ROLE_GROUPS, isInGroup } from '@/constants/roles'
import { geographyService } from '@/core/api/geographyService'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'

export type SiteForm = {
    name: string
    address: string
    city: string
    power: string
    bays: string
    purpose: string
    lease: string
    footfall: string
    monthlyPrice: string
    latitude: string
    longitude: string
    photoFiles: File[]
    photoUrls: string[]
    amenities: Set<string>
    tags: string[]
    ownerId?: string
    postalCode: string
    country: string
}

const Bolt = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
)

const AMENITIES = ['Security', 'Lighting', 'Coffee', 'Restrooms', 'Shelter']
const COMMON_TAGS = ['premium', 'high-traffic', 'airport', 'public', 'private', 'fast-charging', 'overnight', 'commercial']

interface AddSiteProps {
    onSuccess?: (site: SiteForm) => void
    onCancel?: () => void
    isOnboarding?: boolean
    isFirstSite?: boolean
    fullBleed?: boolean
}

export function AddSite({ onSuccess, onCancel, isOnboarding = false, isFirstSite = false, fullBleed = false }: AddSiteProps) {
    const { data: user } = useMe()
    const { data: allUsers } = useUsers()

    // Derived identity flags - these will update reactively as 'user' data arrives
    const isAdmin = isInGroup(user?.role, ROLE_GROUPS.PLATFORM_ADMINS) || user?.role === 'EVZONE_OPERATOR'
    const isSiteOwner = user?.role === 'SITE_OWNER'
    const isStationOwner = user?.role === 'STATION_OWNER'

    const [form, setForm] = useState<SiteForm>({
        name: '',
        address: '',
        city: 'Kampala',
        power: '150',
        bays: '10',
        purpose: 'Commercial', // Temporary default until user loads
        lease: 'Revenue share',
        footfall: 'Medium',
        monthlyPrice: '',
        latitude: '',
        longitude: '',
        photoFiles: [],
        photoUrls: [],
        amenities: new Set(['Security', 'Lighting']),
        tags: [],
        ownerId: '',
        postalCode: '',
        country: '',
    })

    const [tagInput, setTagInput] = useState('')
    const [error, setError] = useState('')
    const [ack, setAck] = useState('')
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; percent: number } | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Sync purpose with user role once it loads
    useEffect(() => {
        if (!user) return
        if (isSiteOwner) setForm(prev => ({ ...prev, purpose: 'Commercial' }))
        else if (isStationOwner) setForm(prev => ({ ...prev, purpose: 'Personal' }))
    }, [user, isSiteOwner, isStationOwner])

    // Filter potential owners for the select (Admins, Site Owners, Station Owners)
    const potentialOwners = allUsers?.filter(u =>
        u.role === 'SITE_OWNER' || u.role === 'STATION_OWNER'
    ) || []

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
        setAck('Detecting location...')
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude

                setForm((prev) => ({
                    ...prev,
                    latitude: lat.toFixed(6),
                    longitude: lng.toFixed(6),
                }))

                try {
                    // Magic: Reverse Geocode
                    const magic = await geographyService.reverseGeocode(lat, lng)
                    if (magic) {
                        setForm(prev => ({
                            ...prev,
                            city: magic.city || prev.city,
                            postalCode: magic.postalCode || prev.postalCode,
                            country: magic.countryName || prev.country,
                            // If address is empty, maybe set a default or leave it for user
                        }))
                        setAck(`Detected: ${magic.city}, ${magic.countryName}`)
                    } else {
                        setAck('Location coordinates found.')
                    }
                } catch (e) {
                    setAck('Coordinates found, but address lookup failed.')
                }
            },
            () => {
                setError('Unable to retrieve your location.')
            }
        )
    }

    // Auto-detect on mount (IP based) if fields are empty
    useEffect(() => {
        const detectIp = async () => {
            if (form.city !== 'Kampala') return // User already edited or default changed
            try {
                const loc = await geographyService.detectLocation()
                if (loc) {
                    setForm(prev => ({
                        ...prev,
                        city: loc.city || prev.city,
                        postalCode: loc.postalCode || prev.postalCode,
                        country: loc.countryName || prev.country
                    }))
                }
            } catch (e) {
                // Silent fail
            }
        }
        detectIp()
    }, [])

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const files = Array.from(e.target.files)

        // Validate all files first
        const validationErrors: string[] = []
        const validFiles: File[] = []

        files.forEach((file, index) => {
            const validation = validateImageFile(file)
            if (!validation.valid) {
                validationErrors.push(`File ${index + 1}: ${validation.error}`)
            } else {
                validFiles.push(file)
            }
        })

        if (validationErrors.length > 0) {
            setError(validationErrors.join('; '))
            return
        }

        if (validFiles.length === 0) return

        try {
            setIsUploading(true)
            setError('')
            setAck('Uploading images to Cloudinary...')

            const urls = await uploadImagesToCloudinary(validFiles, (current, total, percent) => {
                setUploadProgress({ current, total, percent })
            })

            setForm((prev) => ({
                ...prev,
                photoFiles: [...prev.photoFiles, ...validFiles],
                photoUrls: [...prev.photoUrls, ...urls]
            }))

            setAck(`Successfully uploaded ${urls.length} photo(s)!`)
            setUploadProgress(null)

            // Reset file input
            e.target.value = ''
        } catch (err) {
            setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        } finally {
            setIsUploading(false)
        }
    }

    const removePhoto = (index: number) => {
        setForm((prev) => ({
            ...prev,
            photoFiles: prev.photoFiles.filter((_, i) => i !== index),
            photoUrls: prev.photoUrls.filter((_, i) => i !== index),
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

        // Final mapping ensuring ownerId is correct if not assigned by admin
        const finalForm = {
            ...form,
            ownerId: isAdmin ? form.ownerId : user?.id,
            purpose: isSiteOwner ? 'Commercial' : isStationOwner ? 'Personal' : form.purpose
        }

        if (onSuccess) onSuccess(finalForm)
    }

    const wrapperClassName = isOnboarding
        ? ''
        : fullBleed
            ? 'bg-surface min-h-full w-full p-6 sm:p-8 lg:p-10'
            : 'bg-surface rounded-2xl border border-border p-8 shadow-lg'

    const formContent = (
        <>
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
                        <span className="text-sm font-semibold">Postal / Zip Code</span>
                        <div className="relative">
                            <input
                                value={form.postalCode}
                                onChange={(e) => update('postalCode', e.target.value)}
                                className="input bg-background pr-8"
                                placeholder="e.g. 10001"
                            />
                        </div>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">City</span>
                        <input value={form.city} onChange={(e) => update('city', e.target.value)} className="input bg-background" placeholder="Kampala" />
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-semibold">Country</span>
                        <input value={form.country} onChange={(e) => update('country', e.target.value)} className="input bg-background" placeholder="Uganda" />
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
                    <label className="flex flex-col gap-2 sm:col-span-2">
                        <span className="text-sm font-semibold">Purpose</span>
                        {isSiteOwner || isStationOwner ? (
                            <div className="input bg-muted/20 border-transparent text-muted flex items-center">
                                {isSiteOwner ? 'Commercial' : 'Personal'}
                                <span className="ml-2 text-[10px] bg-muted/40 px-1.5 py-0.5 rounded uppercase">Locked to Role</span>
                            </div>
                        ) : (
                            <select value={form.purpose} onChange={(e) => update('purpose', e.target.value)} className="select bg-background font-medium">
                                {['Personal', 'Commercial'].map((o) => (
                                    <option key={o}>{o}</option>
                                ))}
                            </select>
                        )}
                    </label>
                    {form.purpose === 'Commercial' && (
                        <>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold">Lease type</span>
                                <select value={form.lease} onChange={(e) => update('lease', e.target.value)} className="select bg-background font-medium">
                                    {['Revenue share', 'Fixed rent', 'Hybrid'].map((o) => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-semibold">Expected Monthly Price ($)</span>
                                <input type="number" value={form.monthlyPrice} onChange={(e) => update('monthlyPrice', e.target.value)} className="input bg-background" placeholder="Optional" />
                            </label>
                            <label className="flex flex-col gap-2 sm:col-span-2">
                                <span className="text-sm font-semibold">Expected Footfall</span>
                                <select value={form.footfall} onChange={(e) => update('footfall', e.target.value)} className="select bg-background font-medium">
                                    {['Low', 'Medium', 'High', 'Very high'].map((o) => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}

                    {isAdmin && (
                        <label className="flex flex-col gap-2 sm:col-span-2">
                            <span className="text-sm font-semibold text-accent">Assign Site Owner (Admin Only)</span>
                            <select
                                value={form.ownerId}
                                onChange={(e) => update('ownerId', e.target.value)}
                                className="select border-accent/20 bg-accent/5"
                                required
                            >
                                <option value="">Select an owner...</option>
                                {potentialOwners.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.name || u.email} ({u.role})
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
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
                        <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                            disabled={isUploading}
                        />
                        <label htmlFor="photo-upload" className={`cursor-pointer flex flex-col items-center gap-2 ${isUploading ? 'opacity-50' : ''}`}>
                            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-sm font-medium text-accent">{isUploading ? 'Uploading...' : 'Click to upload photos'}</span>
                            <span className="text-xs text-muted">JPEG, PNG, or WebP (max 10MB each)</span>
                        </label>
                    </div>

                    {form.photoUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {form.photoUrls.map((url, i) => (
                                <div key={i} className="relative group aspect-square bg-muted rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={url.replace('/upload/', '/upload/w_200,h_200,c_fill,f_auto,q_auto/')}
                                        alt={`Photo ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                {a}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="pt-6 border-t border-border flex items-center justify-between gap-4">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl border-2 border-border font-bold hover:bg-muted transition-all">
                            Cancel
                        </button>
                    )}
                    <button type="submit" className="flex-[2] py-3 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-md active:scale-[0.98]">
                        {isOnboarding ? 'Create Site & Continue' : 'Create Parking Site'}
                    </button>
                </div>
            </form>
        </>
    )

    if (isOnboarding) {
        return <div className={wrapperClassName}>{formContent}</div>
    }

    return (
        <DashboardLayout pageTitle="Add New Site">
            <div className={wrapperClassName}>{formContent}</div>
        </DashboardLayout>
    )
}
