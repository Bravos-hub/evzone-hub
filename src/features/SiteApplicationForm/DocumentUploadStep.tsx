import { useState } from 'react'
import { useUploadDocument } from '@/modules/applications/hooks'

interface DocumentUploadStepProps {
    documents: any[]
    onDocumentsChange: (docs: any[]) => void
    onNext: () => void
    onBack: () => void
}

const documentCategories = [
    {
        category: 'Legal',
        types: [
            { name: 'Certificate of Incorporation', required: true },
            { name: 'Business Registration Certificate', required: true },
            { name: 'Tax Compliance Certificate', required: true },
            { name: 'Company Profile/Brochure', required: false },
        ]
    },
    {
        category: 'Financial',
        types: [
            { name: 'Bank Reference Letter', required: true },
            { name: 'Audited Financial Statements (Last 2 Years)', required: true },
            { name: 'Proof of Financial Capacity', required: true },
        ]
    },
    {
        category: 'Technical',
        types: [
            { name: 'Technical Specifications of Charging Equipment', required: true },
            { name: 'Safety & Compliance Certificates', required: true },
            { name: 'Insurance Coverage Certificate', required: true },
            { name: 'Maintenance & Operations Plan', required: false },
        ]
    },
    {
        category: 'Experience',
        types: [
            { name: 'Portfolio of Existing Installations', required: false },
            { name: 'Client References/Testimonials', required: false },
            { name: 'Case Studies', required: false },
        ]
    }
]

export function DocumentUploadStep({ documents, onDocumentsChange, onNext, onBack }: DocumentUploadStepProps) {
    const [dragActive, setDragActive] = useState(false)
    // const uploadDocument = useUploadDocument() // Unused and requires args

    const handleFileSelect = (file: File, category: string, documentType: string, required: boolean) => {
        const newDoc = {
            id: `DOC-${Date.now()}`,
            category,
            documentType,
            fileName: file.name,
            fileSize: file.size,
            file,
            required,
            uploadedAt: new Date().toISOString()
        }
        onDocumentsChange([...documents, newDoc])
    }

    const handleDrop = (e: React.DragEvent, category: string, documentType: string, required: boolean) => {
        e.preventDefault()
        setDragActive(false)

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFileSelect(files[0], category, documentType, required)
        }
    }

    const removeDocument = (id: string) => {
        onDocumentsChange(documents.filter(d => d.id !== id))
    }

    const getDocumentForType = (category: string, type: string) => {
        return documents.find(d => d.category === category && d.documentType === type)
    }

    const requiredDocsUploaded = documentCategories
        .flatMap(cat => cat.types.filter(t => t.required))
        .every(type => documents.some(d => d.documentType === type.name))

    const handleNext = () => {
        if (!requiredDocsUploaded) {
            alert('Please upload all required documents before proceeding')
            return
        }
        onNext()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold mb-4">Document Upload</h2>
                <p className="text-muted text-sm">Upload required documents to support your application</p>
            </div>

            {/* Document Categories */}
            <div className="space-y-6">
                {documentCategories.map((category) => (
                    <div key={category.category} className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted uppercase tracking-wide flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${category.types.filter(t => t.required).every(t => getDocumentForType(category.category, t.name))
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                                }`} />
                            {category.category} Documents
                        </h3>

                        <div className="space-y-2">
                            {category.types.map((type) => {
                                const uploadedDoc = getDocumentForType(category.category, type.name)

                                return (
                                    <div key={type.name} className="border border-border rounded-lg p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium">{type.name}</span>
                                                    {type.required && (
                                                        <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-medium">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>

                                                {uploadedDoc ? (
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="font-medium">{uploadedDoc.fileName}</span>
                                                        </div>
                                                        <span className="text-xs text-muted">
                                                            ({(uploadedDoc.fileSize / 1024).toFixed(1)} KB)
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDocument(uploadedDoc.id)}
                                                            className="text-xs text-red-500 hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`mt-2 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${dragActive ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
                                                            }`}
                                                        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                                                        onDragLeave={() => setDragActive(false)}
                                                        onDrop={(e) => handleDrop(e, category.category, type.name, type.required)}
                                                    >
                                                        <input
                                                            type="file"
                                                            id={`file-${category.category}-${type.name}`}
                                                            className="hidden"
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) handleFileSelect(file, category.category, type.name, type.required)
                                                            }}
                                                        />
                                                        <label htmlFor={`file-${category.category}-${type.name}`} className="cursor-pointer">
                                                            <div className="text-xs text-muted">
                                                                <span className="text-accent font-medium">Click to upload</span> or drag and drop
                                                            </div>
                                                            <div className="text-xs text-muted mt-1">PDF, DOC, JPG, PNG (max 10MB)</div>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Summary */}
            <div className="bg-muted/20 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium">Upload Progress</div>
                        <div className="text-xs text-muted mt-1">
                            {documents.length} documents uploaded
                            {!requiredDocsUploaded && (
                                <span className="text-amber-600 ml-2">• Some required documents are missing</span>
                            )}
                        </div>
                    </div>
                    {requiredDocsUploaded && (
                        <div className="flex items-center gap-2 text-emerald-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">All required documents uploaded</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t border-border">
                <button type="button" onClick={onBack} className="btn secondary px-6">
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    className="btn px-6"
                    disabled={!requiredDocsUploaded}
                >
                    Next Step →
                </button>
            </div>
        </div>
    )
}
