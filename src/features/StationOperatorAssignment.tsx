import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useStation, useUpdateStation } from '@/core/api/hooks/useStations'
import { useUsers } from '@/core/api/hooks/useUsers'
import { PATHS } from '@/app/router/paths'
import { getErrorMessage } from '@/core/api/errors'

export function StationOperatorAssignment() {
    const { id } = useParams<{ id: string }>()
    const nav = useNavigate()

    const { data: station, isLoading: stationLoading } = useStation(id || '')
    const { mutate: updateStation, isPending: isUpdating } = useUpdateStation()
    const { data: usersData, isLoading: usersLoading } = useUsers()

    const operators = useMemo(() => {
        if (!usersData) return []
        // Filter for users with role STATION_OPERATOR or EVZONE_OPERATOR (for demo/legacy)
        return usersData.filter(u => u.role === 'STATION_OPERATOR' || u.role === 'EVZONE_OPERATOR')
    }, [usersData])

    const [selectedOp, setSelectedOp] = useState('')
    const [contractType, setContractType] = useState<'FIXED' | 'REVENUE_SHARE' | 'HYBRID'>('REVENUE_SHARE')
    const [revenueShare, setRevenueShare] = useState(15)
    const [error, setError] = useState('')

    const handleAssign = () => {
        if (!selectedOp) {
            setError('Please select an operator')
            return
        }

        updateStation({
            id: id!,
            data: {
                operatorId: selectedOp,
                contractType,
                revenueShare
            }
        }, {
            onSuccess: () => {
                nav(PATHS.STATIONS.DETAIL(id!))
            },
            onError: (err) => {
                setError(getErrorMessage(err))
            }
        })
    }

    if (stationLoading || usersLoading) {
        return (
            <DashboardLayout pageTitle="Assign Station Operator">
                <div className="card text-center py-8 text-muted">Loading...</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout pageTitle={`Assign Operator: ${station?.name}`}>
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Link to={PATHS.STATIONS.DETAIL(id!)} className="text-sm text-subtle hover:text-text mb-2 inline-block">
                        ← Back to Station details
                    </Link>
                    <h1 className="text-2xl font-bold">Assign Station Operator</h1>
                    <p className="text-muted text-sm mt-1">
                        Setting an operator delegates day-to-day management. You will retain visibility into all transactions.
                    </p>
                </div>

                <div className="card space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="label">Select Operator</label>
                        <select
                            className="select w-full"
                            value={selectedOp}
                            onChange={(e) => setSelectedOp(e.target.value)}
                        >
                            <option value="">-- Choose an operator --</option>
                            {operators.map(op => (
                                <option key={op.id} value={op.id}>{op.name} ({op.email})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Contract Type</label>
                            <select
                                className="select w-full"
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value as any)}
                            >
                                <option value="REVENUE_SHARE">Revenue Share</option>
                                <option value="FIXED">Fixed Fee</option>
                                <option value="HYBRID">Hybrid (Fixed + Share)</option>
                            </select>
                        </div>
                        {contractType !== 'FIXED' && (
                            <div>
                                <label className="label">Revenue Share (%)</label>
                                <input
                                    type="number"
                                    className="input w-full"
                                    value={revenueShare}
                                    onChange={(e) => setRevenueShare(Number(e.target.value))}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        )}
                    </div>

                    <div className="info-box bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800 mb-1">Operational Shift</h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Upon assignment, {operators.find(o => o.id === selectedOp)?.name || 'the operator'} will gain access to:
                            <br />• Site staff management (Managers, Attendants)
                            <br />• Technical control (Reboot, Unlock, Firmware)
                            <br />• Operational reporting and analytics
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-border">
                        <button
                            className="btn secondary"
                            onClick={() => nav(PATHS.STATIONS.DETAIL(id!))}
                            disabled={isUpdating}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn primary"
                            onClick={handleAssign}
                            disabled={isUpdating || !selectedOp}
                        >
                            {isUpdating ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default StationOperatorAssignment
