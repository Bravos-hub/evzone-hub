import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles.css'
import { App } from '@/app/App'
import { ThemeProvider } from '@/ui/theme/provider'
import { DEMO_MODE } from '@/core/api/config'

const qc = new QueryClient()

// Initialize MSW in demo mode (non-blocking)
async function enableMocking() {
  if (!DEMO_MODE) {
    return
  }

  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    })
    console.log('MSW worker started successfully')
  } catch (error) {
    console.warn('Failed to start MSW worker:', error)
    // Continue anyway - app should work without MSW in demo mode
  }
}

// Start MSW in background (non-blocking)
enableMocking().catch(console.error)

// Render app immediately (don't wait for MSW)
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found!')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)

