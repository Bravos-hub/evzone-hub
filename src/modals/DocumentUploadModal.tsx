import { useState } from 'react'

interface DocumentUploadModalProps {
    tenantId: string
    onClose: () => void
    onSuccess: (doc: any) => void
}

export function DocumentUploadModal({ tenantId, onClose, onSuccess }: DocumentUploadModalProps) {
    const [name, setName] = useState('')
    const [category, setCategory] = useState('Legal')
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setIsUploading(true)
        // Simulating upload
        setTimeout(() => {
            onSuccess({
                id: `DOC-${Math.floor(Math.random() * 1000)}`,
                name: name || file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                date: new Date().toISOString().split('T')[0],
                category,
                file // Pass the actual File object
            })
            setIsUploading(false)
        }, 1500)
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-panel border border-border-light rounded-2xl shadow-2xl w-full max-w-md max-h-full overflow-hidden flex flex-col scale-in">
                <div className="p-5 sm:p-6 border-b border-border-light flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Upload Document</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted">Document Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Revised Lease 2024"
                                className="input w-full"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="input w-full bg-surface"
                            >
                                <option value="Legal">Legal</option>
                                <option value="Insurance">Insurance</option>
                                <option value="Financial">Financial</option>
                                <option value="Operational">Operational</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted">File</label>
                            <label className="relative group cursor-pointer">
                                <div className="border-2 border-dashed border-border-light group-hover:border-accent/50 rounded-xl p-8 transition-colors flex flex-col items-center justify-center bg-muted/5">
                                    <svg className="w-8 h-8 text-muted/50 mb-3 group-hover:text-accent/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-sm font-medium text-text">
                                        {file ? file.name : 'Click to select or drag and drop'}
                                    </span>
                                    <span className="text-xs text-muted mt-1">
                                        PDF, DOCX up to 10MB
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    accept=".pdf,.doc,.docx"
                                />
                            </label>
                        </div>
                    </div>
                </form>

                <div className="p-5 sm:p-6 border-t border-border-light flex-shrink-0 mt-auto">
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="btn secondary" disabled={isUploading}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="btn"
                            disabled={!file || isUploading}
                        >
                            {isUploading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Uploading...
                                </div>
                            ) : 'Start Upload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
