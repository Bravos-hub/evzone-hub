import { useState } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'

/**
 * Smart Charging Page - Owner feature
 */
export function SmartCharging() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'smartCharging')

  const [loadBalancing, setLoadBalancing] = useState(true)
  const [peakShaving, setPeakShaving] = useState(true)
  const [maxGridLoad, setMaxGridLoad] = useState(150)

  // Remove DashboardLayout wrapper - this is now rendered within Stations tabs
  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card">
          <div className="text-xs text-muted">Current Load</div>
          <div className="text-xl font-bold text-text">85 kW</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Max Capacity</div>
          <div className="text-xl font-bold text-text">{maxGridLoad} kW</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Active Sessions</div>
          <div className="text-xl font-bold text-accent">12</div>
        </div>
        <div className="card">
          <div className="text-xs text-muted">Load Savings Today</div>
          <div className="text-xl font-bold text-ok">$142.50</div>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-text mb-4">Load Management</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Load Balancing</span>
              <input
                type="checkbox"
                checked={loadBalancing}
                onChange={(e) => setLoadBalancing(e.target.checked)}
                disabled={!perms.configure}
                className="h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Peak Shaving</span>
              <input
                type="checkbox"
                checked={peakShaving}
                onChange={(e) => setPeakShaving(e.target.checked)}
                disabled={!perms.configure}
                className="h-5 w-5"
              />
            </label>
            <div>
              <label className="block text-sm text-muted mb-1">Max Grid Load (kW)</label>
              <input
                type="number"
                value={maxGridLoad}
                onChange={(e) => setMaxGridLoad(Number(e.target.value))}
                disabled={!perms.configure}
                className="input w-full"
              />
            </div>
          </div>
          {perms.configure && (
            <button className="btn secondary mt-4" onClick={() => alert('Settings saved (demo)')}>
              Save Settings
            </button>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-text mb-4">Current Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>CP-001 (CCS2)</span>
              <span className="font-semibold">22 kW</span>
            </div>
            <div className="flex items-center justify-between">
              <span>CP-002 (Type 2)</span>
              <span className="font-semibold">11 kW</span>
            </div>
            <div className="flex items-center justify-between">
              <span>CP-003 (CCS2)</span>
              <span className="font-semibold">32 kW</span>
            </div>
            <div className="flex items-center justify-between">
              <span>CP-004 (CHAdeMO)</span>
              <span className="font-semibold">20 kW</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-light flex justify-between font-semibold">
            <span>Total</span>
            <span>85 kW / 150 kW</span>
          </div>
        </div>
      </div>
    </>
  )
}

