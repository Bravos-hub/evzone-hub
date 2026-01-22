import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { useLeases } from '@/modules/applications/hooks/useApplications'
import { EVChargingAnimation } from '@/ui/components/EVChargingAnimation'

export function TenantLeaseCompliance() {
  const { data: leases, isLoading } = useLeases()
  const leaseList = leases || []
  const expansionUnits = leaseList.reduce((sum, lease) => sum + (lease.numberOfChargingPoints || 0), 0)
  const expiringLeases = leaseList
    .filter(lease => lease.leaseEndDate)
    .map(lease => ({
      id: lease.id,
      siteName: lease.siteName,
      endDate: lease.leaseEndDate ? new Date(lease.leaseEndDate) : null,
    }))
    .filter(item => item.endDate)
    .map(item => ({
      ...item,
      daysRemaining: Math.ceil(((item.endDate as Date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }))
    .filter(item => item.daysRemaining >= 0 && item.daysRemaining <= 60)

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Lease & Compliance">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-24 h-24 overflow-hidden flex items-center justify-center">
            <EVChargingAnimation />
          </div>
          <p className="text-text-secondary animate-pulse">Analyzing lease agreements...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Lease & Expansion Compliance">
      <div className="flex flex-col gap-6 lg:gap-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-accent/5 border-accent/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Total Active Leases</span>
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
              </div>
            </div>
            <p className="text-3xl font-black text-text">{leaseList.length}</p>
            <p className="text-xs text-text-secondary mt-1">Sites occupied across 2 regions</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Next Rent Due</span>
              <div className="p-2 rounded-lg bg-warn/10 text-warn">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-3xl font-black text-text">N/A</p>
            <p className="text-xs text-text-secondary mt-1">Schedule data not available yet</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Expansion Capacity</span>
              <div className="p-2 rounded-lg bg-ok/10 text-ok">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
            </div>
            <p className="text-3xl font-black text-text">{expansionUnits || 'N/A'}</p>
            <p className="text-xs text-text-secondary mt-1">Total chargers across active leases</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Site Lease Details</h3>
            <div className="flex flex-col gap-3">
              {leaseList.map(lease => (
                <Card key={lease.id} className="p-5 border-white/5 hover:bg-white/[0.02] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-text mb-1">{lease.siteName}</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-text-secondary">Model: {lease.preferredLeaseModel || 'Standard'}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-text-secondary">Start: {lease.leaseStartDate ? new Date(lease.leaseStartDate).toLocaleDateString() : 'Pending'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-text">
                        ${(lease.proposedRent || lease.negotiatedTerms?.monthlyRent || 0).toLocaleString()}
                      </p>
                      <p className="text-[9px] font-bold text-text-secondary uppercase">Site Earnings Share</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary">Critical Alerts & Reconciliation</h3>
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-text">Contracts Expiring Soon</p>
                  {expiringLeases.length === 0 ? (
                    <p className="text-xs text-text-secondary mt-0.5">No leases expiring in the next 60 days.</p>
                  ) : (
                    <div className="text-xs text-text-secondary mt-0.5 space-y-1">
                      {expiringLeases.slice(0, 2).map(item => (
                        <div key={item.id}>
                          {item.siteName || 'Site'} expires in {item.daysRemaining} days.
                        </div>
                      ))}
                      {expiringLeases.length > 2 && (
                        <div>+{expiringLeases.length - 2} more expiring leases</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Card className="p-5 border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-text">Utility Reconciliation</h4>
                  <span className="text-[10px] font-bold text-muted uppercase">Unavailable</span>
                </div>
                <div className="space-y-3">
                  <div className="text-xs text-text-secondary">
                    No reconciliation data is available yet for this lease set.
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TenantLeaseCompliance
