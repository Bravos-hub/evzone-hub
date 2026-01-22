import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useSubmitApplication } from '@/modules/applications/hooks/useApplications'
import { ApplicantInfoStep } from './SiteApplicationForm/ApplicantInfoStep'
import { SiteSelectionStep } from './SiteApplicationForm/SiteSelectionStep'
import { DocumentUploadStep } from './SiteApplicationForm/DocumentUploadStep'
import { ReviewSubmitStep } from './SiteApplicationForm/ReviewSubmitStep'

type FormStep = 'info' | 'site' | 'documents' | 'review'

interface FormData {
    // Organization Details
    organizationName: string
    businessRegistrationNumber: string
    taxComplianceNumber: string

    // Contact Information
    contactPersonName: string
    contactEmail: string
    contactPhone: string
    physicalAddress: string
    companyWebsite: string

    // Business Experience
    yearsInEVBusiness: string
    existingStationsOperated: number

    // Site & Proposal
    siteId: string
    preferredLeaseModel: 'Revenue Share' | 'Fixed Rent' | 'Hybrid'
    businessPlanSummary: string
    sustainabilityCommitments: string
    additionalServices: string[]
    estimatedStartDate: string
    message: string
}

const initialFormData: FormData = {
    organizationName: '',
    businessRegistrationNumber: '',
    taxComplianceNumber: '',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    physicalAddress: '',
    companyWebsite: '',
    yearsInEVBusiness: '<1',
    existingStationsOperated: 0,
    siteId: '',
    preferredLeaseModel: 'Fixed Rent',
    businessPlanSummary: '',
    sustainabilityCommitments: '',
    additionalServices: [],
    estimatedStartDate: '',
    message: ''
}

export interface SiteApplicationFormProps {
    siteId?: string
    onSuccess?: () => void
    onCancel?: () => void
    embedded?: boolean
}

export function SiteApplicationForm({ siteId, onSuccess, onCancel, embedded = false }: SiteApplicationFormProps = {}) {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const preSelectedSiteId = siteId || searchParams.get('siteId')

    const [currentStep, setCurrentStep] = useState<FormStep>('info')
    const [formData, setFormData] = useState<FormData>({
        ...initialFormData,
        siteId: preSelectedSiteId || ''
    })
    const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])

    const submitApplication = useSubmitApplication()

    const steps: { id: FormStep; label: string; number: number }[] = [
        { id: 'info', label: 'Applicant Information', number: 1 },
        { id: 'site', label: 'Site & Business Proposal', number: 2 },
        { id: 'documents', label: 'Document Upload', number: 3 },
        { id: 'review', label: 'Review & Submit', number: 4 },
    ]

    const currentStepIndex = steps.findIndex(s => s.id === currentStep)
    const progress = ((currentStepIndex + 1) / steps.length) * 100

    const updateFormData = (updates: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...updates }))
    }

    const goToNextStep = () => {
        const nextIndex = currentStepIndex + 1
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id)
        }
    }

    const goToPreviousStep = () => {
        const prevIndex = currentStepIndex - 1
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id)
        } else if (onCancel) {
            onCancel()
        }
    }

    const handleSubmit = async () => {
        try {
            await submitApplication.mutateAsync(formData)
            if (onSuccess) {
                onSuccess()
            } else {
                navigate('/tenants?tab=applications')
            }
        } catch (error) {
            console.error('Failed to submit application:', error)
        }
    }

    const content = (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Site Application Form</h1>
                <p className="text-muted mt-1">Apply to lease charging station space at available sites</p>
            </div>

            {/* Progress Bar */}
            <div className="bg-surface rounded-xl border border-border p-6">
                <div className="flex justify-between mb-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex-1 relative">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${index <= currentStepIndex
                                        ? 'bg-accent text-white border-accent'
                                        : 'bg-surface text-muted border-border'
                                        }`}
                                >
                                    {step.number}
                                </div>
                                <div className={`mt-2 text-xs text-center ${index === currentStepIndex ? 'text-accent font-medium' : 'text-muted'}`}>
                                    {step.label}
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-border -z-10">
                                    <div
                                        className="h-full bg-accent transition-all"
                                        style={{ width: index < currentStepIndex ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 bg-border rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Form Steps */}
            <div className="bg-surface rounded-xl border border-border p-6">
                {currentStep === 'info' && (
                    <ApplicantInfoStep
                        data={formData}
                        onChange={updateFormData}
                        onNext={goToNextStep}
                    />
                )}
                {currentStep === 'site' && (
                    <SiteSelectionStep
                        data={formData}
                        onChange={updateFormData}
                        onNext={goToNextStep}
                        onBack={goToPreviousStep}
                    />
                )}
                {currentStep === 'documents' && (
                    <DocumentUploadStep
                        documents={uploadedDocuments}
                        onDocumentsChange={setUploadedDocuments}
                        onNext={goToNextStep}
                        onBack={goToPreviousStep}
                    />
                )}
                {currentStep === 'review' && (
                    <ReviewSubmitStep
                        data={formData}
                        documents={uploadedDocuments}
                        onBack={goToPreviousStep}
                        onSubmit={handleSubmit}
                        isSubmitting={submitApplication.isPending}
                    />
                )}
            </div>
        </div>
    )

    if (embedded) {
        return content
    }

    return (
        <DashboardLayout pageTitle="Apply for Site">
            {content}
        </DashboardLayout>
    )
}

export default SiteApplicationForm
