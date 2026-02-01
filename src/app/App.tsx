import { AppRoutes } from '@/app/router/routes'

import { FeatureFlagProvider } from '@/core/contexts/FeatureFlagContext';

export function App() {
  return (
    <FeatureFlagProvider>
      <AppRoutes />
    </FeatureFlagProvider>
  )
}

