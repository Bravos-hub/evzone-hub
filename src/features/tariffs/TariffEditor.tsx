import { useState, useEffect } from 'react'
import { Card } from '@/ui/components/Card'
import type { Tariff, TariffElement } from '@/core/types/domain'
import { CreateTariffRequest, UpdateTariffRequest } from '@/modules/finance/billing/tariffService'

type TariffEditorProps = {
    tariff?: Tariff
    onSave: (data: CreateTariffRequest | UpdateTariffRequest) => void
    onCancel: () => void
    isSaving?: boolean
}

export function TariffEditor({ tariff, onSave, onCancel, isSaving }: TariffEditorProps) {
    const [name, setName] = useState(tariff?.name || '')
    const [type, setType] = useState<Tariff['type']>(tariff?.type || 'Time-based')
    const [paymentModel, setPaymentModel] = useState<'Prepaid' | 'Postpaid'>(tariff?.paymentModel || 'Postpaid')
    const [currency, setCurrency] = useState(tariff?.currency || 'USD')
    const [elements, setElements] = useState<TariffElement[]>(tariff?.elements || [])

    // Initialize with one element if empty
    useEffect(() => {
        if (elements.length === 0) {
            setElements([{ pricePerKwh: 0, startTime: '00:00', endTime: '23:59' }])
        }
    }, [elements.length])

    const handleAddElement = () => {
        setElements([...elements, { pricePerKwh: 0, startTime: '00:00', endTime: '23:59' }])
    }

    const handleRemoveElement = (index: number) => {
        setElements(elements.filter((_, i) => i !== index))
    }

    const updateElement = (index: number, field: keyof TariffElement, value: any) => {
        const newElements = [...elements]
        newElements[index] = { ...newElements[index], [field]: value }
        setElements(newElements)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            name,
            type,
            paymentModel,
            currency,
            elements
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl p-6 m-auto">
                <h2 className="text-xl font-semibold mb-4">{tariff ? 'Edit Tariff' : 'Create Tariff'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="input w-full" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Currency</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value)} className="select w-full">
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} className="select w-full">
                                <option value="Time-based">Time-based</option>
                                <option value="Energy-based">Energy-based (kWh)</option>
                                <option value="Fixed">Fixed Fee</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Payment Model</label>
                            <div className="flex bg-muted rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModel('Postpaid')}
                                    className={`flex-1 py-1 px-3 text-sm rounded-md transition-colors ${paymentModel === 'Postpaid' ? 'bg-white shadow text-text' : 'text-muted-foreground hover:text-text'}`}
                                >
                                    Postpaid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentModel('Prepaid')}
                                    className={`flex-1 py-1 px-3 text-sm rounded-md transition-colors ${paymentModel === 'Prepaid' ? 'bg-white shadow text-text' : 'text-muted-foreground hover:text-text'}`}
                                >
                                    Prepaid
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Pricing Elements ({type})</h3>
                            <button type="button" onClick={handleAddElement} className="text-sm text-accent hover:underline">+ Add Time Band</button>
                        </div>

                        <div className="space-y-3">
                            {elements.map((el, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-muted/30 p-3 rounded-lg border border-border">
                                    <div className="grid grid-cols-3 gap-2 flex-1">
                                        <div>
                                            <label className="text-xs text-muted block mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                value={el.startTime}
                                                onChange={e => updateElement(idx, 'startTime', e.target.value)}
                                                className="input w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted block mb-1">End Time</label>
                                            <input
                                                type="time"
                                                value={el.endTime}
                                                onChange={e => updateElement(idx, 'endTime', e.target.value)}
                                                className="input w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted block mb-1">Price {type === 'Energy-based' ? '/ kWh' : type === 'Time-based' ? '/ min' : ''}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={type === 'Energy-based' ? el.pricePerKwh : el.pricePerMinute}
                                                onChange={e => updateElement(idx, type === 'Energy-based' ? 'pricePerKwh' : 'pricePerMinute', parseFloat(e.target.value))}
                                                className="input w-full"
                                            />
                                        </div>
                                    </div>
                                    {elements.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveElement(idx)} className="text-red-500 hover:text-red-700 mt-6">
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onCancel} className="btn secondary" disabled={isSaving}>Cancel</button>
                        <button type="submit" className="btn primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Tariff'}</button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
