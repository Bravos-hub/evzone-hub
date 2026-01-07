import { useNavigate } from 'react-router-dom'

/* ─────────────────────────────────────────────────────────────────────────────
   Error Pages — 404, 500, Offline, Browser Unsupported
───────────────────────────────────────────────────────────────────────────── */

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-subtle mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-subtle mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-subtle mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
            Go Back
          </button>
          <a href="/dashboard" className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

export function ServerError() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-subtle mb-2">500</h1>
        <h2 className="text-xl font-semibold mb-2">Server Error</h2>
        <p className="text-subtle mb-6">
          Something went wrong on our end. Please try again later or contact support if the problem persists.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
            Refresh Page
          </button>
          <a href="/help" className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

export function Offline() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M8.5 16.5c.5-1 1.5-2 3.5-2s3 1 3.5 2" />
            <path d="M2 8.82a15 15 0 0120 0" />
            <path d="M5 12.86a10 10 0 0114 0" />
            <path d="M8.5 16.5a5 5 0 017 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">You're Offline</h2>
        <p className="text-subtle mb-6">
          It looks like you've lost your internet connection. Please check your network and try again.
        </p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">
          Try Again
        </button>
      </div>
    </div>
  )
}

export function BrowserUnsupported() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted text-subtle mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Browser Not Supported</h2>
        <p className="text-subtle mb-6">
          Your browser is not supported. Please use a modern browser like Chrome, Firefox, Safari, or Edge for the best experience.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
            Get Chrome
          </a>
          <a href="https://www.mozilla.org/firefox/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-border hover:bg-muted">
            Get Firefox
          </a>
        </div>
      </div>
    </div>
  )
}

export default NotFound

