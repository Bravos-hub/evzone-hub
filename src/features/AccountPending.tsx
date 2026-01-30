import React from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'

/**
 * Account Pending Page
 * Shown when a user has completed registration but is awaiting admin approval.
 */
export function AccountPending() {
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="rounded-[32px] bg-panel border border-border p-8 md:p-12 text-center shadow-xl">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent mb-6 animate-pulse">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-bold text-text mb-4">Application Under Review</h2>

                    <div className="space-y-4 text-text-secondary mb-8">
                        <p className="text-lg">
                            Thank you for joining the EVzone ecosystem! Your account has been created successfully.
                        </p>
                        <p>
                            To ensure the security and quality of our network, our operations team is currently reviewing your documentation.
                            This typically takes <strong>24-48 hours</strong>.
                        </p>
                        <p className="text-sm italic">
                            You will receive an email notification as soon as your account is activated.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Link
                            to={PATHS.HOME}
                            className="px-6 py-3 rounded-2xl border border-border hover:bg-bg-secondary transition font-semibold"
                        >
                            Back to Home
                        </Link>
                        <Link
                            to={PATHS.AUTH.LOGIN}
                            className="px-6 py-3 rounded-2xl bg-accent text-white hover:bg-accent-hover transition font-semibold shadow-accent"
                        >
                            Sign Out
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
