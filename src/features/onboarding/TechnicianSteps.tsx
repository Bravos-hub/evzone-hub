import { useState } from 'react'
import { Link } from 'react-router-dom'

type Props = {
    onComplete: () => void
    onBack: () => void
}

type Step = 'profile' | 'certs'

/* ─────────────────────────────────────────────────────────────────────────────
   Forms Types
   ───────────────────────────────────────────────────────────────────────────── */
type TechnicianProfile = {
    name: string
    email: string
    phone: string
    city: string
    rate: string
    about: string
    skills: Set<string>
}

type TechnicianCerts = {
    certs: Set<string>
    license: string
    expiry: string
    agree: boolean
    uploads: {
        id: string
        cert: string
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────────────────── */
const CITIES = ['Kampala', 'Nairobi', 'Wuxi', 'Lagos']
const RATES = ['<$50/hr', '$50-$100/hr', '>$100/hr']
const SKILLS = ['OCPP', 'DC Fast', 'ISO 15118', 'AC Type 2', 'Diagnostics', 'Firmware']
const CERT_OPTS = ['OCPP', 'ISO 15118', 'Electrical License', 'OEM-A', 'OEM-B']

export function TechnicianSteps({ onComplete, onBack }: Props) {
    const [step, setStep] = useState<Step>('profile')

    const [profile, setProfile] = useState<TechnicianProfile>({
        name: '',
        email: '',
        phone: '',
        city: 'Kampala',
        rate: '$50-$100/hr',
        about: '',
        skills: new Set(['OCPP', 'AC Type 2']),
    })

    const [certs, setCerts] = useState<TechnicianCerts>({
        certs: new Set(['OCPP']),
        license: '',
        expiry: '',
        agree: false,
        uploads: { id: '', cert: '' },
    })

    // Helpers
    const arrowRight = (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
    )

    const toggleSet = <T,>(current: Set<T>, val: T): Set<T> => {
        const next = new Set(current)
        next.has(val) ? next.delete(val) : next.add(val)
        return next
    }

    const updateProfile = (k: keyof TechnicianProfile, v: any) => setProfile(p => ({ ...p, [k]: v }))
    const updateCerts = (k: keyof TechnicianCerts, v: any) => setCerts(p => ({ ...p, [k]: v }))

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile.name || !profile.email || profile.skills.size === 0) return
        setStep('certs')
    }

    const handleCertsSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!certs.agree || certs.certs.size === 0) return

        // Save
        localStorage.setItem('onb.technician.profile', JSON.stringify({ ...profile, skills: [...profile.skills] }))
        localStorage.setItem('onb.technician.certs', JSON.stringify({ ...certs, certs: [...certs.certs] }))
        onComplete()
    }

    return (
        <div className="space-y-6">
            {/* --- Step 1: Profile --- */}
            {step === 'profile' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Technician Profile</h2>
                        <span className="text-xs text-subtle uppercase tracking-wider">Step 1 of 2</span>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Name / Company</span>
                                <input value={profile.name} onChange={e => updateProfile('name', e.target.value)} className="input" placeholder="RapidCharge Techs" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Email</span>
                                <input type="email" value={profile.email} onChange={e => updateProfile('email', e.target.value)} className="input" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Phone</span>
                                <input value={profile.phone} onChange={e => updateProfile('phone', e.target.value)} className="input" />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">City / Region</span>
                                <select value={profile.city} onChange={e => updateProfile('city', e.target.value)} className="select">
                                    {CITIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Rate Band</span>
                                <select value={profile.rate} onChange={e => updateProfile('rate', e.target.value)} className="select">
                                    {RATES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </label>
                            <label className="grid gap-1 sm:col-span-2">
                                <span className="text-sm font-medium">About</span>
                                <textarea rows={3} value={profile.about} onChange={e => updateProfile('about', e.target.value)} className="input" placeholder="Experience..." />
                            </label>
                        </div>

                        <fieldset>
                            <legend className="text-sm font-medium mb-1">Skills</legend>
                            <div className="flex flex-wrap gap-2">
                                {SKILLS.map(s => (
                                    <label key={s} className={`badge-check ${profile.skills.has(s) ? 'active' : ''}`}>
                                        <input type="checkbox" className="sr-only" checked={profile.skills.has(s)} onChange={() => updateProfile('skills', toggleSet(profile.skills, s))} />
                                        {s}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="flex items-center justify-between pt-4">
                            <button type="button" onClick={onBack} className="btn secondary">Back</button>
                            <button type="submit" className="btn flex items-center gap-2">
                                Next {arrowRight}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- Step 2: Certs --- */}
            {step === 'certs' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Certifications</h2>
                        <span className="text-xs text-subtle uppercase tracking-wider">Step 2 of 2</span>
                    </div>

                    <form onSubmit={handleCertsSubmit} className="space-y-6">
                        <fieldset>
                            <legend className="text-sm font-medium mb-1">Select Certifications</legend>
                            <div className="flex flex-wrap gap-2">
                                {CERT_OPTS.map(c => (
                                    <label key={c} className={`badge-check ${certs.certs.has(c) ? 'active' : ''}`}>
                                        <input type="checkbox" className="sr-only" checked={certs.certs.has(c)} onChange={() => updateCerts('certs', toggleSet(certs.certs, c))} />
                                        {c}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">License No.</span>
                                <input value={certs.license} onChange={e => updateCerts('license', e.target.value)} className="input" />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Expiry</span>
                                <input type="date" value={certs.expiry} onChange={e => updateCerts('expiry', e.target.value)} className="input" />
                            </label>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={certs.agree} onChange={e => updateCerts('agree', e.target.checked)} className="checkbox mt-1" />
                                <span className="text-sm text-subtle">
                                    I confirm the details are accurate and agree to the terms.
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button type="button" onClick={() => setStep('profile')} className="btn secondary">Back</button>
                            <button type="submit" disabled={!certs.agree} className="btn primary flex items-center gap-2 disabled:opacity-50">
                                Complete Registration {arrowRight}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style>{`
        .badge-check {
          @apply cursor-pointer text-xs px-3 py-1.5 rounded-full border border-border text-subtle transition-all flex items-center gap-2;
        }
        .badge-check.active {
          @apply bg-accent/10 border-accent text-accent font-medium;
        }
      `}</style>
        </div>
    )
}
