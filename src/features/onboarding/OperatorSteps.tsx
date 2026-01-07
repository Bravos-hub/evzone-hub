import { useState } from 'react'
import { Link } from 'react-router-dom'

type Props = {
    onComplete: () => void
    onBack: () => void
}

type Step = 'company' | 'billing'

/* ─────────────────────────────────────────────────────────────────────────────
   Forms Types
   ───────────────────────────────────────────────────────────────────────────── */
type OperatorCompany = {
    company: string
    regions: Set<string>
    sla: string
    response: string
    noc: string
    price: string
    services: Set<string>
    certs: Set<string>
    email: string
    phone: string
    about: string
}

type OperatorBilling = {
    entity: string
    country: string
    city: string
    address: string
    currency: string
    payout: string
    bankHolder: string
    bankName: string
    account: string
    swift: string
    iban: string
    invoiceEmail: string
    taxId: string
    agree: boolean
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────────────────── */
const REGIONS = ['Africa', 'Europe', 'Asia', 'Americas']
const SLAS = ['Bronze', 'Silver', 'Gold', 'Platinum']
const RESP = ['2h', '4h', '8h', 'Next-day']
const NOC = ['24/7', 'Business hours']
const PRICES = ['<$200/site/mo', '$200-$500', '>$500']
const SERVICES = ['24/7 NOC', 'Maintenance', 'Firmware', 'DLM', 'Smart Charging', 'Roaming', 'Dispatch']
const CERTS = ['OCPP', 'ISO 27001', 'SOC 2']
const COUNTRIES = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'China', 'USA', 'Germany']
const CURRENCIES = ['USD', 'EUR', 'UGX', 'CNY', 'KES']
const PAYOUTS = ['Weekly', 'Bi-weekly', 'Monthly']

/* ─────────────────────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────────────────────── */
export function OperatorSteps({ onComplete, onBack }: Props) {
    const [step, setStep] = useState<Step>('company')

    // State
    const [company, setCompany] = useState<OperatorCompany>({
        company: '',
        regions: new Set(['Africa']),
        sla: 'Gold',
        response: '4h',
        noc: '24/7',
        price: '$200-$500',
        services: new Set(['24/7 NOC', 'Maintenance']),
        certs: new Set(['OCPP']),
        email: '',
        phone: '',
        about: '',
    })
    const [billing, setBilling] = useState<OperatorBilling>({
        entity: '',
        country: 'Uganda',
        city: 'Kampala',
        address: '',
        currency: 'USD',
        payout: 'Monthly',
        bankHolder: '',
        bankName: '',
        account: '',
        swift: '',
        iban: '',
        invoiceEmail: '',
        taxId: '',
        agree: false,
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

    const updateCompany = (k: keyof OperatorCompany, v: any) => setCompany(p => ({ ...p, [k]: v }))
    const updateBilling = (k: keyof OperatorBilling, v: any) => setBilling(p => ({ ...p, [k]: v }))

    const handleCompanySubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!company.company || !company.email) return
        setStep('billing')
    }

    const handleBillingSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!billing.entity || !billing.agree) return

        // Save
        localStorage.setItem('onb.operator.company', JSON.stringify({ ...company, regions: [...company.regions], services: [...company.services], certs: [...company.certs] }))
        localStorage.setItem('onb.operator.billing', JSON.stringify(billing))
        onComplete()
    }

    return (
        <div className="space-y-6">
            {/* --- Step 1: Company --- */}
            {step === 'company' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Operator Profile</h2>
                        <span className="text-xs text-subtle uppercase tracking-wider">Step 1 of 2</span>
                    </div>

                    <form onSubmit={handleCompanySubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Company Name</span>
                                <input value={company.company} onChange={e => updateCompany('company', e.target.value)} className="input" placeholder="VoltOps Ltd" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">SLA Tier</span>
                                <select value={company.sla} onChange={e => updateCompany('sla', e.target.value)} className="select">
                                    {SLAS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </label>
                            <label className="grid gap-1 sm:col-span-2">
                                <span className="text-sm font-medium">About</span>
                                <textarea rows={3} value={company.about} onChange={e => updateCompany('about', e.target.value)} className="input" placeholder="Describe operations..." />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Contact Email</span>
                                <input type="email" value={company.email} onChange={e => updateCompany('email', e.target.value)} className="input" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Contact Phone</span>
                                <input value={company.phone} onChange={e => updateCompany('phone', e.target.value)} className="input" />
                            </label>
                        </div>

                        {/* Regions */}
                        <fieldset>
                            <legend className="text-sm font-medium mb-1">Regions</legend>
                            <div className="flex flex-wrap gap-2">
                                {REGIONS.map(r => (
                                    <label key={r} className={`badge-check ${company.regions.has(r) ? 'active' : ''}`}>
                                        <input type="checkbox" className="sr-only" checked={company.regions.has(r)} onChange={() => updateCompany('regions', toggleSet(company.regions, r))} />
                                        {r}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* Services */}
                        <fieldset>
                            <legend className="text-sm font-medium mb-1">Services</legend>
                            <div className="flex flex-wrap gap-2">
                                {SERVICES.map(r => (
                                    <label key={r} className={`badge-check ${company.services.has(r) ? 'active' : ''}`}>
                                        <input type="checkbox" className="sr-only" checked={company.services.has(r)} onChange={() => updateCompany('services', toggleSet(company.services, r))} />
                                        {r}
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

            {/* --- Step 2: Billing --- */}
            {step === 'billing' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Billing & Payout</h2>
                        <span className="text-xs text-subtle uppercase tracking-wider">Step 2 of 2</span>
                    </div>

                    <form onSubmit={handleBillingSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Billing Entity</span>
                                <input value={billing.entity} onChange={e => updateBilling('entity', e.target.value)} className="input" required />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Country</span>
                                <select value={billing.country} onChange={e => updateBilling('country', e.target.value)} className="select">
                                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">City</span>
                                <input value={billing.city} onChange={e => updateBilling('city', e.target.value)} className="input" />
                            </label>
                            <label className="grid gap-1">
                                <span className="text-sm font-medium">Invoicing Email</span>
                                <input type="email" value={billing.invoiceEmail} onChange={e => updateBilling('invoiceEmail', e.target.value)} className="input" required />
                            </label>
                        </div>

                        <fieldset className="p-4 bg-muted/30 rounded-xl space-y-3">
                            <h3 className="text-sm font-semibold">Bank Details</h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <input value={billing.bankHolder} onChange={e => updateBilling('bankHolder', e.target.value)} className="input bg-surface" placeholder="Account Holder" />
                                <input value={billing.bankName} onChange={e => updateBilling('bankName', e.target.value)} className="input bg-surface" placeholder="Bank Name" />
                                <input value={billing.account} onChange={e => updateBilling('account', e.target.value)} className="input bg-surface" placeholder="Account No." />
                                <input value={billing.swift} onChange={e => updateBilling('swift', e.target.value)} className="input bg-surface" placeholder="SWIFT" />
                            </div>
                        </fieldset>

                        <div className="pt-2">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={billing.agree} onChange={e => updateBilling('agree', e.target.checked)} className="checkbox mt-1" />
                                <span className="text-sm text-subtle">
                                    I agree to the billing terms and confirm the payment details are correct.
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button type="button" onClick={() => setStep('company')} className="btn secondary">Back</button>
                            <button type="submit" disabled={!billing.agree} className="btn primary flex items-center gap-2 disabled:opacity-50">
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
