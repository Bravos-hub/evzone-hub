import { DashboardLayout } from '@/app/layouts/DashboardLayout'

export function Help() {
  return (
    <DashboardLayout pageTitle="Help & Support">
      <div className="space-y-4">
        <div className="card">
          <h2 className="font-semibold mb-2">Contact</h2>
          <p className="text-sm text-muted">Email: support@evzone.com • Phone: +1 555 0100</p>
          <button className="btn secondary mt-3" onClick={() => alert('Send message (mock)')}>
            Send message
          </button>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">FAQ</h2>
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted">
            <li>How to start charging?</li>
            <li>How to add a station?</li>
            <li>How to rotate API keys?</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

export function LegalTerms() {
  return (
    <DashboardLayout pageTitle="Terms of Service">
      <div className="card space-y-2">
        <p className="text-sm text-muted">These are the terms (placeholder text)...</p>
      </div>
    </DashboardLayout>
  )
}

export function LegalPrivacy() {
  return (
    <DashboardLayout pageTitle="Privacy Policy">
      <div className="card space-y-2">
        <p className="text-sm text-muted">This is the privacy policy (placeholder text)...</p>
      </div>
    </DashboardLayout>
  )
}

export function LegalCookies() {
  return (
    <DashboardLayout pageTitle="Cookies Policy">
      <div className="card space-y-2">
        <p className="text-sm text-muted">This is the cookies policy (placeholder text)...</p>
      </div>
    </DashboardLayout>
  )
}

