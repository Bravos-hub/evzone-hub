import { useState } from 'react'
import { Link } from 'react-router-dom'

type Props = {
    onComplete: () => void
    onBack: () => void
}

type Step = 'profile' | 'org' | 'protocols'

/* ─────────────────────────────────────────────────────────────────────────────
   Forms Types
   ───────────────────────────────────────────────────────────────────────────── */
type OwnerProfile = {
    name: string
    email: string
    phone: string
    country: string
    city: string
}

type OwnerOrg = {
    org: string
    reg: string
    address: string
    country: string
    vat: string
    website: string
}

type OwnerProtocols = {
    ocpp: string
    ocpi: string
    ocppEnabled: boolean
    ocpiEnabled: boolean
    terms: boolean
}

const REGIONS = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'China', 'USA', 'Germany']

/* ─────────────────────────────────────────────────────────────────────────────
   Components
   ───────────────────────────────────────────────────────────────────────────── */

export function OwnerSteps({ onComplete, onBack }: Props) {
    const [step, setStep] = useState<Step>('profile')

    // Consolidated State
    const [profile, setProfile] = useState<OwnerProfile>({
        name: '',
        email: '',
        phone: '',
        country: 'Uganda',
        city: 'Kampala',
    })
    const [org, setOrg] = useState<OwnerOrg>({
        org: '',
        reg: '',
        address: '',
        country: 'Uganda',
        vat: '',
        website: '',
    })
    const [protocols, setProtocols] = useState<OwnerProtocols>({
        ocpp: '1.6J',
        ocpi: '2.2.1',
        ocppEnabled: true,
        ocpiEnabled: true,
        terms: false,
    })

    // Helpers
    const arrowRight = (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
    )

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile.name || !profile.email) return // Add better validation display if needed
        setStep('org')
    }

    const handleOrgSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!org.org || !org.address) return
        setStep('protocols')
    }

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!protocols.terms) return
        // Persist all data
        localStorage.setItem('onb.owner.profile', JSON.stringify(profile))
        localStorage.setItem('onb.owner.org', JSON.stringify(org))
        localStorage.setItem('onb.owner.protocols', JSON.stringify(protocols))
        onComplete()
    }

    const updateProfile = (k: keyof OwnerProfile, v: any) => setProfile(p => ({ ...p, [k]: v }))
    const updateOrg = (k: keyof OwnerOrg, v: any) => setOrg(p => ({ ...p, [k]: v }))
    const updateProto = (k: keyof OwnerProtocols, v: any) => setProtocols(p => ({ ...p, [k]: v }))

    return (
        <div className="space-y-6">
            {/* --- Step 1: Profile --- */}
            {step === 'profile' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Owner Profile</h2>
                        <span className="text-xs text-subtle uppercase tracking-wider">Step 1 of 3</span>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Full Name</span>
                                <input value={profile.name} onChange={e => updateProfile('name', e.target.value)} className="input" placeholder="Jane Doe" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Email</span>
                                <input type="email" value={profile.email} onChange={e => updateProfile('email', e.target.value)} className="input" placeholder="owner@example.com" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Phone</span>
                                <input value={profile.phone} onChange={e => updateProfile('phone', e.target.value)} className="input" placeholder="+256 700..." />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">City</span>
                                <input value={profile.city} onChange={e => updateProfile('city', e.target.value)} className="input" placeholder="Kampala" />
                            </label>
                            <label className="grid gap-1 sm:col-span-2">
                                <span className="text-sm font-medium">Country</span>
                                <select value={profile.country} onChange={e => updateProfile('country', e.target.value)} className="select">
                                    {REGIONS.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button type="button" onClick={onBack} className="btn secondary">Back</button>
                            <button type="submit" className="btn flex items-center gap-2">
                                Next {arrowRight}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- Step 2: Organization --- */}
            {step === 'org' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Organization Details</h2>
                        <span className="text-xs text-subtle uppercase tracking-wider">Step 2 of 3</span>
                    </div>

                    <form onSubmit={handleOrgSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Organization Name</span>
                                <input value={org.org} onChange={e => updateOrg('org', e.target.value)} className="input" placeholder="Acme Inc" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Registration No.</span>
                                <input value={org.reg} onChange={e => updateOrg('reg', e.target.value)} className="input" />
                            </label>
                            <label className="grid gap-1 sm:col-span-2">
                                <span className="text-sm font-medium">Address</span>
                                <input value={org.address} onChange={e => updateOrg('address', e.target.value)} className="input" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Country</span>
                                <select value={org.country} onChange={e => updateOrg('country', e.target.value)} className="select">
                                    {REGIONS.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">VAT / Tax ID</span>
                                <input value={org.vat} onChange={e => updateOrg('vat', e.target.value)} className="input" />
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button type="button" onClick={() => setStep('profile')} className="btn secondary">Back</button>
                            <button type="submit" className="btn flex items-center gap-2">
                                Next {arrowRight}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- Step 3: Protocols & Terms --- */}
            {step === 'protocols' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Configuration</h2>
                        <span className="text-xs text-subtle uppercase tracking-wider">Step 3 of 3</span>
                    </div>

                    <form onSubmit={handleFinalSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Protocols</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <label className="border border-border p-3 rounded-lg flex items-center gap-3">
                                    <input type="checkbox" checked={protocols.ocppEnabled} onChange={e => updateProto('ocppEnabled', e.target.checked)} className="checkbox" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">Enable OCPP</div>
                                        <select value={protocols.ocpp} onChange={e => updateProto('ocpp', e.target.value)} className="mt-1 w-full text-xs p-1 bg-transparent border-b">
                                            {['1.6J', '2.0.1'].map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </label>
                                <label className="border border-border p-3 rounded-lg flex items-center gap-3">
                                    <input type="checkbox" checked={protocols.ocpiEnabled} onChange={e => updateProto('ocpiEnabled', e.target.checked)} className="checkbox" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">Enable OCPI</div>
                                        <select value={protocols.ocpi} onChange={e => updateProto('ocpi', e.target.value)} className="mt-1 w-full text-xs p-1 bg-transparent border-b">
                                            {['2.2.1', '2.2.0'].map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={protocols.terms} onChange={e => updateProto('terms', e.target.checked)} className="checkbox mt-1" />
                                <span className="text-sm text-subtle">
                                    I agree to the <Link to="/legal/terms" className="text-accent hover:underline">Terms of Service</Link> and <Link to="/legal/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
                                    I confirm that the organization details provided are accurate.
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button type="button" onClick={() => setStep('org')} className="btn secondary">Back</button>
                            <button type="submit" disabled={!protocols.terms} className="btn primary flex items-center gap-2 disabled:opacity-50">
                                Complete Registration {arrowRight}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
