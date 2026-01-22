import { useState, useEffect } from 'react'
import { LeaseTerms } from '@/modules/applications/types'
import clsx from 'clsx'

interface DealConstructorProps {
    initialTerms?: LeaseTerms
    onSave: (terms: LeaseTerms, message?: string) => void
    isSubmitting: boolean
}

const DEFAULT_TERMS: LeaseTerms = {
    monthlyRent: 2000,
    currency: 'USD',
    leaseDuration: 12,
    securityDepositMonths: 2,
    maintenanceResponsibility: 'SHARED',
    utilitiesResponsibility: 'OPERATOR',
    noticePeriodDays: 60,
    renewalOption: true,
    customClauses: []
}

export function DealConstructor({ initialTerms, onSave, isSubmitting }: DealConstructorProps) {
    const [terms, setTerms] = useState<LeaseTerms>(initialTerms || DEFAULT_TERMS)
    const [message, setMessage] = useState('')
    const [newClause, setNewClause] = useState('')

    // Ensure we have valid data even if initialTerms is partial
    useEffect(() => {
        if (initialTerms) {
            setTerms(prev => ({ ...DEFAULT_TERMS, ...initialTerms }))
        }
    }, [initialTerms])

    const handleChange = (field: keyof LeaseTerms, value: any) => {
        setTerms(prev => ({ ...prev, [field]: value }))
    }

    const addClause = () => {
        if (!newClause.trim()) return
        setTerms(prev => ({
            ...prev,
            customClauses: [...(prev.customClauses || []), newClause.trim()]
        }))
        setNewClause('')
    }

    const removeClause = (index: number) => {
        setTerms(prev => ({
            ...prev,
            customClauses: (prev.customClauses || []).filter((_, i) => i !== index)
        }))
    }

    const totalDeposit = (terms.monthlyRent || 0) * (terms.securityDepositMonths || 0)

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Financials Column */}
                <div className="space-y-6">
                    <div className="card p-6 border-l-4 border-l-blue-500">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>💰</span> Financial Terms
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Monthly Rent ({terms.currency})</label>
                                <div className="space-y-1">
                                    <input
                                        type="number"
                                        className="input w-full text-lg font-bold"
                                        value={terms.monthlyRent}
                                        onChange={e => handleChange('monthlyRent', Number(e.target.value))}
                                    />
                                    <p className="text-xs text-muted">Base monthly fee for using the site.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Revenue Share (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="input w-full"
                                            value={terms.revenueSharePercent || 0}
                                            onChange={e => handleChange('revenueSharePercent', Number(e.target.value))}
                                            max={100}
                                            min={0}
                                        />
                                        <span className="absolute right-3 top-3 text-muted">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Security Deposit</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className="input w-20"
                                            value={terms.securityDepositMonths}
                                            onChange={e => handleChange('securityDepositMonths', Number(e.target.value))}
                                        />
                                        <span className="text-sm text-muted">Months</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-500/10 rounded-lg flex justify-between items-center text-sm">
                                <span className="text-blue-200">Total Deposit Required:</span>
                                <span className="font-bold text-lg text-blue-100">${totalDeposit.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 border-l-4 border-l-purple-500">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>⏳</span> Duration & Notice
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Lease Duration</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={terms.leaseDuration}
                                        onChange={e => handleChange('leaseDuration', Number(e.target.value))}
                                    />
                                    <span className="text-sm text-muted">Months</span>
                                </div>
                            </div>
                            <div>
                                <label className="label">Notice Period</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={terms.noticePeriodDays}
                                        onChange={e => handleChange('noticePeriodDays', Number(e.target.value))}
                                    />
                                    <span className="text-sm text-muted">Days</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white/5 rounded">
                                <input
                                    type="checkbox"
                                    checked={terms.renewalOption}
                                    onChange={e => handleChange('renewalOption', e.target.checked)}
                                    className="rounded border-white/20 bg-white/5"
                                />
                                <span className="font-medium">Include Renewal Option</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Operations Column */}
                <div className="space-y-6">
                    <div className="card p-6 border-l-4 border-l-orange-500">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>🛠️</span> Responsibilities
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Maintenance Responsibility</label>
                                <select
                                    className="select w-full bg-white/5"
                                    value={terms.maintenanceResponsibility}
                                    onChange={e => handleChange('maintenanceResponsibility', e.target.value)}
                                >
                                    <option value="OWNER">Owner (Landlord)</option>
                                    <option value="OPERATOR">Operator (Tenant)</option>
                                    <option value="SHARED">Shared</option>
                                </select>
                                <p className="text-xs text-muted mt-1">Who handles equipment and site repairs.</p>
                            </div>

                            <div>
                                <label className="label">Utilities Payment</label>
                                <select
                                    className="select w-full bg-white/5"
                                    value={terms.utilitiesResponsibility}
                                    onChange={e => handleChange('utilitiesResponsibility', e.target.value)}
                                >
                                    <option value="OWNER">Owner (Landlord)</option>
                                    <option value="OPERATOR">Operator (Tenant)</option>
                                </select>
                                <p className="text-xs text-muted mt-1">Who pays for electricity and water.</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 border-l-4 border-l-emerald-500">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span>📝</span> Custom Clauses
                        </h3>

                        <div className="space-y-3 mb-4">
                            {(terms.customClauses || []).map((clause, idx) => (
                                <div key={idx} className="flex gap-2 items-start group">
                                    <div className="p-1.5 mt-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs">
                                        {idx + 1}
                                    </div>
                                    <p className="flex-1 text-sm text-dim bg-white/5 p-2 rounded">{clause}</p>
                                    <button
                                        onClick={() => removeClause(idx)}
                                        className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Clause"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {(terms.customClauses || []).length === 0 && (
                                <p className="text-sm text-muted italic text-center py-4">No custom clauses added.</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input flex-1 text-sm"
                                placeholder="Add a custom clause..."
                                value={newClause}
                                onChange={e => setNewClause(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addClause()}
                            />
                            <button
                                onClick={addClause}
                                className="btn secondary whitespace-nowrap"
                                disabled={!newClause.trim()}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="card p-6 sticky bottom-4 z-10 border-t-2 border-accent shadow-xl bg-bg-secondary">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="label">Note to Applicant (Optional)</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="Explain the changes or provide context..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn primary py-3 px-8 text-lg w-full md:w-auto shadow-lg shadow-accent/20"
                        onClick={() => onSave(terms, message)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Sending Proposal...' : 'Send Proposal'}
                    </button>
                </div>
            </div>
        </div>
    )
}
