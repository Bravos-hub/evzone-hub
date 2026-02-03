import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'

export function AwaitingApproval() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md text-center space-y-6">
                {/* Icon */}
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                {/* Heading */}
                <div>
                    <h2 className="text-2xl font-bold text-text mb-2">Application Under Review</h2>
                    <p className="text-text-secondary text-sm">
                        Your registration is being reviewed by our admin team
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-xl bg-surface border border-border p-6 text-left space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-text">Email Verified</h3>
                            <p className="text-xs text-text-secondary mt-1">
                                Your email address has been successfully verified
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-text">Awaiting Admin Approval</h3>
                            <p className="text-xs text-text-secondary mt-1">
                                Our team is reviewing your application and documents
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="h-6 w-6 rounded-full bg-panel text-text-secondary flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-text">Email Notification</h3>
                            <p className="text-xs text-text-secondary mt-1">
                                You'll receive an email once your application is approved
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="text-xs text-text-secondary bg-panel border border-border rounded-lg p-4">
                    <p>
                        <strong>What happens next?</strong>
                    </p>
                    <p className="mt-2">
                        Our team will review your profile, company details, and uploaded documents. This typically takes 24-48 hours. Once approved, you'll be able to log in and access your dashboard.
                    </p>
                </div>

                {/* Action */}
                <button
                    onClick={() => navigate(PATHS.AUTH.LOGIN)}
                    className="w-full px-4 py-2.5 rounded-lg bg-panel hover:bg-panel-2 border border-border text-text text-sm font-medium transition-colors"
                >
                    Back to Login
                </button>

                {/* Help */}
                <p className="text-xs text-text-secondary">
                    Questions? Contact us at{' '}
                    <a href="mailto:support@evzone.com" className="text-accent hover:underline">
                        support@evzone.com
                    </a>
                </p>
            </div>
        </div>
    )
}
