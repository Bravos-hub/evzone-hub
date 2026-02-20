import type { ProviderDocumentType } from '@/core/api/types'

export type QuickSubmitFormState = {
    relationshipId: string
    requirementCode: string
    type: ProviderDocumentType
    name: string
    file: File | null
    storedEnergyKwh: string
}

type Props = {
    isOpen: boolean
    onClose: () => void
    providerName: string
    form: QuickSubmitFormState
    setForm: (form: QuickSubmitFormState) => void
    requirements: Array<{ requirementCode: string; title: string; acceptedDocTypes?: string[] }>
    onSubmit: () => void
    isSubmitting: boolean
}

export function QuickSubmitModal({
    isOpen,
    onClose,
    providerName,
    form,
    setForm,
    requirements,
    onSubmit,
    isSubmitting
}: Props) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Quick Submit Relationship Pack</h3>
                    <button
                        type="button"
                        className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Provider: {providerName || 'Unknown'}</div>

                <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    value={form.requirementCode}
                    onChange={(e) => {
                        const requirementCode = e.target.value
                        const requirement = requirements.find((item) => item.requirementCode === requirementCode)
                        setForm({
                            ...form,
                            requirementCode,
                            type: (requirement?.acceptedDocTypes?.[0] as ProviderDocumentType | undefined) || form.type,
                            name: requirement?.title || form.name,
                        })
                    }}
                >
                    <option value="">Select station-owner requirement</option>
                    {requirements.map((requirement) => (
                        <option key={requirement.requirementCode} value={requirement.requirementCode}>
                            {requirement.title}
                        </option>
                    ))}
                </select>

                <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    value={form.type}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            type: e.target.value as ProviderDocumentType,
                        })
                    }
                >
                    <option value="SITE_COMPATIBILITY_DECLARATION">SITE_COMPATIBILITY_DECLARATION</option>
                    <option value="TECHNICAL_CONFORMANCE">TECHNICAL_CONFORMANCE</option>
                    <option value="SOP_ACKNOWLEDGEMENT">SOP_ACKNOWLEDGEMENT</option>
                    <option value="INSURANCE">INSURANCE</option>
                    <option value="COMMERCIAL_AGREEMENT">COMMERCIAL_AGREEMENT</option>
                </select>

                <input
                    className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Document name"
                />
                <input
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                    type="file"
                    onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                />
                <input
                    className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    value={form.storedEnergyKwh}
                    onChange={(e) => setForm({ ...form, storedEnergyKwh: e.target.value })}
                    placeholder="Stored energy kWh (optional, for HK DG profile checks)"
                />

                <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white bg-accent border border-transparent rounded-md hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={onSubmit}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Pack'}
                    </button>
                </div>
            </div>
        </div>
    )
}
