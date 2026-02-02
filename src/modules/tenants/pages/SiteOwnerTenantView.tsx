import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { PATHS } from '@/app/router/paths'
import { getErrorMessage } from '@/core/api/errors'
import { useTenant, useTenantContract } from '@/modules/applications/hooks/useApplications'
import { useAssignedOperator } from '@/modules/tenants/hooks/useTenantDashboard'
import { useStations } from '@/modules/stations/hooks/useStations'
import { useSite } from '@/modules/sites/hooks/useSites'
import { InlineSkeleton, TextSkeleton } from '@/ui/components/SkeletonCards'

export function SiteOwnerTenantView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: tenant, isLoading: tenantLoading, error } = useTenant(id || '')
  const { data: contract, isLoading: contractLoading } = useTenantContract(id || '')
  const { data: site } = useSite(tenant?.siteId || '')
  const { data: stations = [] } = useStations()
  const { data: assignedOperator } = useAssignedOperator(tenant?.siteId)

  const tenantStations = useMemo(() => {
    if (!tenant) return []
    return stations.filter(
      station => station.ownerId === tenant.id || station.orgId === tenant.siteId
    )
  }, [stations, tenant])

  const stationStats = useMemo(() => {
    const total = tenantStations.length
    const active = tenantStations.filter(station => station.status === 'ACTIVE').length
    const maintenance = tenantStations.filter(station => station.status === 'MAINTENANCE').length
    const offline = Math.max(0, total - active - maintenance)
    const uptime = total > 0 ? Math.round((active / total) * 1000) / 10 : 0
    return { total, active, maintenance, offline, uptime }
  }, [tenantStations])

  const isDelegated = tenantStations.some(
    station => station.operatorId && station.operatorId !== station.ownerId
  )

  const complianceScore = useMemo(() => {
    const violations = contract?.violations?.length ?? 0
    const outstandingDebt = tenant?.outstandingDebt ?? 0
    const debtPenalty = Math.min(30, Math.floor(outstandingDebt / 1000) * 5)
    return Math.max(0, 100 - violations * 10 - debtPenalty)
  }, [contract?.violations, tenant?.outstandingDebt])

  const paymentStatus = useMemo(() => {
    const debt = tenant?.outstandingDebt ?? 0
    if (debt === 0) return 'Good'
    if (debt <= 1000) return 'Fair'
    if (debt <= 5000) return 'Poor'
    return 'Critical'
  }, [tenant?.outstandingDebt])

  if (tenantLoading) {
    return (
      <DashboardLayout pageTitle="Tenant Health">
        <div className="py-8">
          <TextSkeleton lines={2} centered />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !tenant) {
    return (
      <DashboardLayout pageTitle="Tenant Health">
        <div className="p-4 bg-danger/10 text-danger rounded-lg">
          {error ? getErrorMessage(error) : 'Tenant not found'}
        </div>
      </DashboardLayout>
    )
  }

  const expectedRevenue = tenant.earnings ?? 0
  const reportedRevenue = tenant.totalPaid ?? expectedRevenue
  const revenueVariance = expectedRevenue - reportedRevenue

  return (
    <DashboardLayout pageTitle="Tenant Health & Compliance">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-sm text-muted">
              {tenant.siteName} {site?.address ? `• ${site.address}` : ''}
            </p>
          </div>
          <button className="btn secondary" onClick={() => navigate(PATHS.SITE_OWNER.TENANTS)}>
            Back to Tenants
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-[10px] uppercase text-muted">Compliance Score</div>
            <div className="mt-2 text-2xl font-bold">{complianceScore}%</div>
            <div className="text-xs text-muted mt-1">Payment status: {paymentStatus}</div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase text-muted">Lease Status</div>
            <div className="mt-2 text-2xl font-bold">{contract?.status || 'Pending'}</div>
            <div className="text-xs text-muted mt-1">Model: {contract?.model || tenant.model}</div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase text-muted">Outstanding Balance</div>
            <div className="mt-2 text-2xl font-bold">${(tenant.outstandingDebt || 0).toLocaleString()}</div>
            <div className="text-xs text-muted mt-1">
              Total paid: ${(tenant.totalPaid || 0).toLocaleString()}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase text-muted">Operational Model</div>
            <div className="mt-2 text-2xl font-bold">{isDelegated ? 'Delegated' : 'Self-Managed'}</div>
            <div className="text-xs text-muted mt-1">
              Operator: {assignedOperator?.name || (isDelegated ? 'Assigned' : 'Tenant')}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Lease Compliance</h2>
              <span className="text-xs text-muted">
                {contractLoading ? <InlineSkeleton width={60} height={10} /> : 'Current'}
              </span>
            </div>
            {contractLoading && (
              <div className="text-sm">
                <TextSkeleton lines={2} />
              </div>
            )}
            {!contractLoading && contract && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Rent</span>
                  <span className="font-semibold">
                    {contract.currency} {contract.rent.toLocaleString()} / {contract.paymentSchedule}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Term</span>
                  <span className="font-semibold">{contract.terms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Start</span>
                  <span className="font-semibold">{new Date(contract.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">End</span>
                  <span className="font-semibold">{new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
                {contract.violations && contract.violations.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs uppercase text-muted mb-2">Violations</div>
                    <ul className="list-disc list-inside text-xs text-muted space-y-1">
                      {contract.violations.map((violation, idx) => (
                        <li key={`${violation}-${idx}`}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!contractLoading && !contract && (
              <div className="text-sm text-muted">No contract information available.</div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Site Performance</h2>
              <span className="text-xs text-muted">{stationStats.uptime}% uptime</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase text-muted">Stations</div>
                <div className="text-lg font-bold">{stationStats.total}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Active</div>
                <div className="text-lg font-bold">{stationStats.active}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Maintenance</div>
                <div className="text-lg font-bold">{stationStats.maintenance}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Offline</div>
                <div className="text-lg font-bold">{stationStats.offline}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted">
              Lease model: <span className="font-semibold text-text">{tenant.model}</span>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Operator Transparency</h2>
              <span className="text-xs text-muted">{isDelegated ? 'Delegated' : 'Self-Managed'}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted">Operator</div>
                <div className="font-semibold">
                  {assignedOperator?.name || (isDelegated ? 'Assigned Operator' : tenant.name)}
                </div>
                <div className="text-xs text-muted">{assignedOperator?.email || 'Contact not available'}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Contract Status</div>
                <div className="font-semibold">{contract?.status || 'Pending'}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Revenue Share Audit</div>
                <div className="flex items-center justify-between text-sm">
                  <span>Expected</span>
                  <span className="font-semibold">${expectedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Reported</span>
                  <span className="font-semibold">${reportedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Variance</span>
                  <span className={revenueVariance >= 0 ? 'text-ok font-semibold' : 'text-warn font-semibold'}>
                    {revenueVariance >= 0 ? '+' : '-'}${Math.abs(revenueVariance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Payment Activity</h2>
              <span className="text-xs text-muted">{paymentStatus}</span>
            </div>
            <div className="space-y-3 text-sm">
              {tenant.paymentHistory && tenant.paymentHistory.length > 0 ? (
                tenant.paymentHistory.slice(0, 4).map(payment => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">${payment.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted">{new Date(payment.date).toLocaleDateString()}</div>
                    </div>
                    <span className="text-xs text-muted">{payment.status}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted">No payment history recorded yet.</div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default SiteOwnerTenantView
