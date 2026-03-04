import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useChargePoint, useUpdateChargePoint } from '@/modules/charge-points/hooks/useChargePoints'
import { useStation } from '@/modules/stations/hooks/useStations'
import { useMe } from '@/modules/auth/hooks/useAuth'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { ROLE_GROUPS } from '@/constants/roles'
import { canAccessStation } from '@/core/auth/rbac'
import { StationStatusPill } from '@/ui/components/StationStatusPill'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import { getErrorMessage } from '@/core/api/errors'
import { chargePointService } from '@/modules/charge-points/services/chargePointService'
import { formatDistanceToNow } from 'date-fns'

/* ─────────────────────────────────────────────────────────────────────────────
   ChargePointDetail — Granular charger management for station owners/admins
   Allows editing capacity, managing parking bays, and remote commands.
───────────────────────────────────────────────────────────────────────────── */

export function ChargePointDetail() {
    const { id } = useParams<{ id: string }>()
    const { data: cp, isLoading, error } = useChargePoint(id!)
    const updateCP = useUpdateChargePoint()
    const { user } = useAuthStore()
    const perms = getPermissionsForFeature(user?.role, 'chargePoints')
    const { data: me, isLoading: meLoading } = useMe()
    const { data: station, isLoading: stationLoading } = useStation(cp?.stationId || '')

    const accessContext = {
        role: user?.role,
        userId: me?.id || user?.id,
        orgId: me?.orgId || me?.organizationId || user?.orgId || user?.organizationId,
        assignedStations: me?.assignedStations || [],
        capability: me?.ownerCapability || user?.ownerCapability,
        viewAll: perms.viewAll,
    }

    const needsScope = user?.role === 'STATION_OWNER' || user?.role === 'STATION_OPERATOR'
    const accessLoading = needsScope && (meLoading || stationLoading)
    const stationAccessTarget = station || (cp as any)?.station
    const hasAccess = stationAccessTarget
        ? canAccessStation(accessContext, stationAccessTarget, 'CHARGE')
        : (perms.viewAll || (user?.role ? ROLE_GROUPS.PLATFORM_OPS.includes(user.role) : false))

    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        model: '',
        maxCapacityKw: 0,
        ocppId: '',
    })

    const [isAddingBay, setIsAddingBay] = useState(false)
    const [newBay, setNewBay] = useState({
        bay: '',
        type: 'EV Charging' as const,
    })
    const [commandBusy, setCommandBusy] = useState<'remoteStart' | 'softReset' | 'reboot' | 'unlock' | null>(null)
    const [commandFeedback, setCommandFeedback] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)

    const runCommand = async (
        command: 'remoteStart' | 'softReset' | 'reboot' | 'unlock',
        label: string,
        execute: () => Promise<{ commandId: string; status: string; error?: string }>
    ) => {
        try {
            setCommandFeedback(null)
            setCommandBusy(command)
            const response = await execute()
            const latest = await chargePointService.getCommandStatus(response.commandId).catch(() => null)
            const finalStatus = latest?.status || response.status
            const finalError = latest?.error || response.error
            const failedStates = new Set(['Failed', 'Rejected', 'Timeout', 'NOT_FOUND'])

            if (failedStates.has(finalStatus)) {
                setCommandFeedback({
                    tone: 'error',
                    message: `${label} failed (${finalStatus})${finalError ? `: ${finalError}` : ''}`,
                })
                return
            }

            setCommandFeedback({
                tone: 'ok',
                message: `${label} queued (${finalStatus})`,
            })
        } catch (err) {
            setCommandFeedback({
                tone: 'error',
                message: getErrorMessage(err),
            })
        } finally {
            setCommandBusy(null)
        }
    }

    const handleRemoteStart = () => {
        if (!id) return
        const connectorId = cp?.connectors?.[0]?.id ?? 1
        runCommand('remoteStart', 'Remote start', () =>
            chargePointService.remoteStart(id, {
                connectorId,
                evseId: connectorId,
                idTag: 'EVZONE_REMOTE',
                remoteStartId: Math.floor(Date.now() / 1000),
            })
        )
    }

    const handleSoftReset = () => {
        if (!id) return
        runCommand('softReset', 'Soft reset', () => chargePointService.softReset(id))
    }

    const handleReboot = () => {
        if (!id) return
        runCommand('reboot', 'Reboot', () => chargePointService.reboot(id))
    }

    const handleUnlock = () => {
        if (!id) return
        const connectorId = cp?.connectors?.[0]?.id ?? 1
        runCommand('unlock', 'Unlock connector', () =>
            chargePointService.unlockConnector(id, {
                connectorId,
                evseId: connectorId,
            })
        )
    }

    const handleEdit = () => {
        if (!cp) return
        setEditForm({
            model: cp.model,
            maxCapacityKw: cp.maxCapacityKw || 50,
            ocppId: cp.ocppId || '',
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        await updateCP.mutateAsync({
            id: id!,
            data: {
                model: editForm.model,
                maxCapacityKw: editForm.maxCapacityKw,
                ocppId: editForm.ocppId,
            }
        })
        setIsEditing(false)
    }

    if (!perms.access) {
        return (
            <DashboardLayout pageTitle="Charger Management">
                <div className="card">
                    <p className="text-muted">You don't have permission to view this page.</p>
                </div>
            </DashboardLayout>
        )
    }

    if (isLoading) return (
        <DashboardLayout pageTitle="Charger Management">
            <div className="flex items-center justify-center h-64">
                <TextSkeleton lines={2} />
            </div>
        </DashboardLayout>
    )

    if (error || !cp) return (
        <DashboardLayout pageTitle="Charger Management">
            <div className="p-8 text-center text-red-500">
                {error ? getErrorMessage(error) : 'Charger not found.'}
            </div>
        </DashboardLayout>
    )

    if (accessLoading) {
        return (
            <DashboardLayout pageTitle="Charger Management">
                <div className="flex items-center justify-center h-64">
                    <TextSkeleton lines={2} />
                </div>
            </DashboardLayout>
        )
    }

    if (!hasAccess) {
        return (
            <DashboardLayout pageTitle="Charger Management">
                <div className="card">
                    <p className="text-muted">You don't have permission to view this page.</p>
                </div>
            </DashboardLayout>
        )
    }

    const displayOcppId =
        typeof cp.ocppId === 'string' && cp.ocppId.trim().length > 0
            ? cp.ocppId.trim()
            : cp.id
    const chargeName =
        typeof cp.model === 'string' && cp.model.trim().length > 0
            ? cp.model.trim()
            : 'Charge Point'
    const chargeTitle = `${chargeName} - ${displayOcppId}`

    return (
        <DashboardLayout pageTitle={chargeTitle}>
            <div className="mb-6">
                <button
                    onClick={() => window.history.back()}
                    className="text-sm text-subtle hover:text-text mb-2 inline-block bg-transparent border-none cursor-pointer p-0"
                >
                    ← Back
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{chargeTitle}</h1>
                        <p className="text-muted">{cp.manufacturer} {cp.model}</p>
                    </div>
                    <StationStatusPill status={cp.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* General Info & Capacity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">General Settings</h2>
                            {!isEditing ? (
                                <button className="btn secondary text-xs" onClick={handleEdit}>Edit Settings</button>
                            ) : (
                                <div className="flex gap-2">
                                    <button className="btn secondary text-xs" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button className="btn accent text-xs" onClick={handleSave}>Save Changes</button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase font-bold">Model</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={editForm.model}
                                        onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-lg font-medium">{cp.model}</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase font-bold">Maximum Capacity (kW)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={editForm.maxCapacityKw}
                                        onChange={e => setEditForm({ ...editForm, maxCapacityKw: parseInt(e.target.value) })}
                                    />
                                ) : (
                                    <div className="text-lg font-medium">{cp.maxCapacityKw || 50} kW</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase font-bold">Serial Number</label>
                                <div className="text-lg font-medium">{cp.serialNumber}</div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase font-bold">Firmware</label>
                                <div className="text-lg font-medium">{cp.firmwareVersion}</div>
                            </div>
                        </div>
                    </div>

                    {/* OCPI Configuration */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4">OCPI Configuration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase font-bold">OCPP Identity</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={editForm.ocppId}
                                        onChange={e => setEditForm({ ...editForm, ocppId: e.target.value })}
                                    />
                                ) : (
                                    <div className="text-lg font-medium">{cp.ocppId || '-'}</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase font-bold">Roaming Status</label>
                                <div className="flex items-center gap-2">
                                    <span className="pill pending">Unpublished</span>
                                    <button className="text-xs text-accent hover:underline" onClick={() => alert('Roaming publication logic would go here')}>Enable Roaming</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Parking Bays */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Associated Parking Bays</h2>
                            <button className="btn secondary text-xs" onClick={() => setIsAddingBay(true)}>+ Add Bay</button>
                        </div>

                        <div className="space-y-3">
                            {!cp.parkingBays || cp.parkingBays.length === 0 ? (
                                <div className="text-center py-8 bg-muted/20 rounded-lg text-subtle italic">
                                    No parking bays assigned to this unit.
                                </div>
                            ) : (
                                <div className="table-wrap">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Bay ID</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* We would normally fetch the full bay objects here, 
                                                but for MVP we can show just the IDs or keep it simple */}
                                            {cp.parkingBays.map(bayId => (
                                                <tr key={bayId}>
                                                    <td className="font-bold">{bayId}</td>
                                                    <td>EV Charging</td>
                                                    <td>Active</td>
                                                    <td className="text-right">
                                                        <button className="text-danger text-xs font-bold hover:underline">Unlink</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Remote Commands & Status */}
                <div className="space-y-6">
                    <div className="card bg-muted/10 border-accent/20">
                        <h2 className="text-xl font-bold mb-4">Remote Commands</h2>
                        {!perms.remoteCommands ? (
                            <p className="text-sm text-subtle">You do not have permission to send remote commands.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {commandFeedback && (
                                    <div className={`rounded-md border px-3 py-2 text-xs ${commandFeedback.tone === 'ok'
                                        ? 'border-ok/40 bg-ok/10 text-ok'
                                        : 'border-danger/40 bg-danger/10 text-danger'
                                        }`}>
                                        {commandFeedback.message}
                                    </div>
                                )}
                                <button
                                    className={`btn secondary w-full flex items-center justify-between ${commandBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    onClick={handleRemoteStart}
                                    disabled={Boolean(commandBusy)}
                                >
                                    <span>{commandBusy === 'remoteStart' ? 'Sending...' : 'Remote Start Session'}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                                <button
                                    className={`btn secondary w-full flex items-center justify-between ${commandBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    onClick={handleSoftReset}
                                    disabled={Boolean(commandBusy)}
                                >
                                    <span>{commandBusy === 'softReset' ? 'Sending...' : 'Soft Reset'}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                                <button
                                    className={`btn secondary w-full flex items-center justify-between ${commandBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    onClick={handleReboot}
                                    disabled={Boolean(commandBusy)}
                                >
                                    <span>{commandBusy === 'reboot' ? 'Sending...' : 'Reboot Hardware'}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </button>
                                <button
                                    className={`btn secondary w-full flex items-center justify-between ${commandBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    onClick={handleUnlock}
                                    disabled={Boolean(commandBusy)}
                                >
                                    <span>{commandBusy === 'unlock' ? 'Sending...' : 'Unlock Connector'}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h2 className="text-sm font-bold uppercase text-muted mb-4">Unit Health</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">OCPP Connection</span>
                                <span className={`text-sm font-bold ${cp.status === 'Online' || cp.status === 'Available' ? 'text-ok' : 'text-danger'}`}>
                                    {cp.status === 'Online' || cp.status === 'Available' ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Heartbeat</span>
                                <span className="text-sm text-subtle">
                                    {cp.lastHeartbeat ? `${formatDistanceToNow(new Date(cp.lastHeartbeat))} ago` : 'Never'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Error Code</span>
                                <span className="text-sm text-subtle">0 (Normal)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Bay Modal */}
            {isAddingBay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-4">Add Parking Bay</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase">Bay Name/ID</label>
                                <input
                                    type="text"
                                    className="input w-full mt-1"
                                    placeholder="e.g. BAY-101"
                                    value={newBay.bay}
                                    onChange={e => setNewBay({ ...newBay, bay: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted uppercase">Bay Type</label>
                                <select
                                    className="select w-full mt-1"
                                    value={newBay.type}
                                    onChange={e => setNewBay({ ...newBay, type: e.target.value as any })}
                                >
                                    <option value="EV Charging">EV Charging</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Handicap">Handicap</option>
                                    <option value="VIP">VIP</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button className="btn secondary flex-1" onClick={() => setIsAddingBay(false)}>Cancel</button>
                                <button className="btn accent flex-1" onClick={async () => {
                                    // In a real app we'd call a mutation
                                    await updateCP.mutateAsync({
                                        id: id!,
                                        data: {
                                            parkingBays: [...(cp.parkingBays || []), newBay.bay]
                                        }
                                    })
                                    setIsAddingBay(false)
                                    setNewBay({ bay: '', type: 'EV Charging' })
                                }}>Add & Link</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}

