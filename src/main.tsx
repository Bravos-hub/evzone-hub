import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/styles.css'
import { App } from '@/app/App'
import { ThemeProvider } from '@/ui/theme/provider'
import { DEMO_MODE } from '@/core/api/config'

const qc = new QueryClient()

// Initialize MSW in demo mode
async function enableMocking() {
  if (!DEMO_MODE) {
    return
  }

  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
  })
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
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
})

