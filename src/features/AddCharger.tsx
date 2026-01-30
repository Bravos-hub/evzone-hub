import { useState } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useCreateChargePoint } from '@/modules/charge-points/hooks/useChargePoints'
import { useStations } from '@/modules/stations/hooks/useStations'
import { auditLogger } from '@/core/utils/auditLogger'
import { getErrorMessage } from '@/core/api/errors'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'

/* ─────────────────────────────────────────────────────────────────────────────
   Add Charger Wizard — Step-by-step charger provisioning
   RBAC: Owners, Station Admins
───────────────────────────────────────────────────────────────────────────── */

type ChargerType = 'AC' | 'DC'

interface ConnectorSpec {
  key: string
  displayName: string
  standards: string[]
  physicalFamily: string
  supports: { ac: boolean; dc: boolean }
  acRatings?: { phases: string; voltageMaxV: number; currentMaxA: number; powerMaxkW?: number }
  dcRatings?: { voltageMaxV: number; currentMaxA?: number; powerMaxkW?: number }
  commonRegions: string[]
  notes?: string[]
}

const CONNECTOR_SPECS: ConnectorSpec[] = [
  {
    key: 'type1',
    displayName: 'Type 1 (SAE J1772)',
    standards: ['SAE J1772', 'IEC 62196 Type 1'],
    physicalFamily: 'Type 1',
    supports: { ac: true, dc: false },
    acRatings: { phases: '1P', voltageMaxV: 240, currentMaxA: 80, powerMaxkW: 19.2 },
    commonRegions: ['North America', 'Japan', 'Korea'],
    notes: ['DC fast charging is typically via CCS1 or CHAdeMO, not this connector.']
  },
  {
    key: 'type2',
    displayName: 'Type 2 (IEC 62196-2)',
    standards: ['IEC 62196-2'],
    physicalFamily: 'Type 2',
    supports: { ac: true, dc: false },
    acRatings: { phases: '3P', voltageMaxV: 400, currentMaxA: 63, powerMaxkW: 43 },
    commonRegions: ['Europe', 'UK', 'Oceania'],
    notes: ['EU requires Type 2 for AC interoperability; DC is generally via CCS2.']
  },
  {
    key: 'ccs1',
    displayName: 'CCS Combo 1 (CCS1)',
    standards: ['IEC 62196-3', 'CCS'],
    physicalFamily: 'Type 1-derived (combo)',
    supports: { ac: true, dc: true },
    dcRatings: { voltageMaxV: 1000, currentMaxA: 500, powerMaxkW: 500 },
    commonRegions: ['North America']
  },
  {
    key: 'ccs2',
    displayName: 'CCS Combo 2 (CCS2)',
    standards: ['IEC 62196-3', 'CCS'],
    physicalFamily: 'Type 2-derived (combo)',
    supports: { ac: true, dc: true },
    dcRatings: { voltageMaxV: 1000, currentMaxA: 500, powerMaxkW: 500 },
    commonRegions: ['Europe', 'UK', 'Oceania']
  },
  {
    key: 'nacs',
    displayName: 'NACS (SAE J3400)',
    standards: ['SAE J3400'],
    physicalFamily: 'NACS',
    supports: { ac: true, dc: true },
    dcRatings: { voltageMaxV: 1000 },
    commonRegions: ['North America'],
    notes: ['Current is temperature-managed; power varies by implementation.']
  },
  {
    key: 'chademo',
    displayName: 'CHAdeMO',
    standards: ['CHAdeMO'],
    physicalFamily: 'CHAdeMO',
    supports: { ac: false, dc: true },
    dcRatings: { voltageMaxV: 1000, currentMaxA: 400, powerMaxkW: 400 },
    commonRegions: ['Japan']
  },
  {
    key: 'gbt_ac',
    displayName: 'GB/T AC (GB/T 20234.2)',
    standards: ['GB/T 20234.2'],
    physicalFamily: 'GB/T',
    supports: { ac: true, dc: false },
    acRatings: { phases: '3P', voltageMaxV: 440, currentMaxA: 63 },
    commonRegions: ['China']
  },
  {
    key: 'gbt_dc',
    displayName: 'GB/T DC (GB/T 20234.3)',
    standards: ['GB/T 20234.3', 'GB/T 20234.1'],
    physicalFamily: 'GB/T',
    supports: { ac: false, dc: true },
    dcRatings: { voltageMaxV: 1500, currentMaxA: 1000 },
    commonRegions: ['China'],
    notes: ['Earlier 2015 DC interface was 1000V/250A; newer family expands scope.']
  },
  {
    key: 'type3',
    displayName: 'Type 3 (Scame) — Legacy',
    standards: ['IEC 62196 Type 3'],
    physicalFamily: 'Type 3',
    supports: { ac: true, dc: false },
    acRatings: { phases: '3P', voltageMaxV: 480, currentMaxA: 63 },
    commonRegions: ['Europe'],
    notes: ['Legacy France/Italy; largely superseded by Type 2.']
  },
  {
    key: 'mcs',
    displayName: 'MCS (Megawatt Charging)',
    standards: ['MCS (CharIN)'],
    physicalFamily: 'MCS',
    supports: { ac: false, dc: true },
    dcRatings: { voltageMaxV: 1250, currentMaxA: 3000, powerMaxkW: 3750 },
    commonRegions: ['Global'],
    notes: ['Heavy-duty trucks; uses very high current.']
  }
]

// Helper to get available connectors based on charger type
const getAvailableConnectors = (chargerType: ChargerType): ConnectorSpec[] => {
  return CONNECTOR_SPECS.filter(c =>
    chargerType === 'AC' ? c.supports.ac : c.supports.dc
  )
}

// Get max power for a connector based on charger type
const getConnectorMaxPower = (connectorKey: string, chargerType: ChargerType): number => {
  const spec = CONNECTOR_SPECS.find(c => c.key === connectorKey)
  if (!spec) return 22
  if (chargerType === 'DC' && spec.dcRatings?.powerMaxkW) return spec.dcRatings.powerMaxkW
  if (chargerType === 'AC' && spec.acRatings?.powerMaxkW) return spec.acRatings.powerMaxkW
  return chargerType === 'DC' ? 150 : 22
}

interface ChargerForm {
  name: string
  site: string
  type: ChargerType
  power: number
  connectors: { type: string; maxPower: number }[]
  serialNumber: string
  manufacturer: string
  model: string
  firmware: string
  ocppId: string
  networkSSID: string
  networkPassword: string
}

const STEPS = [
  { key: 'site', label: 'Select Site' },
  { key: 'connect', label: 'Connect to Charger' },
  { key: 'network', label: 'Network Setup' },
  { key: 'details', label: 'Charger Details' },
  { key: 'review', label: 'Review & Provision' },
]

export function AddCharger() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canAdd = hasPermission(role, 'charge-points', 'create') || hasPermission(role, 'stations', 'create')

  const [step, setStep] = useState(0)
  // connectionState: idle -> scanning -> discovered -> connecting -> connected
  const [connectionState, setConnectionState] = useState<'idle' | 'scanning' | 'discovered' | 'connecting' | 'connected'>('idle')

  const [form, setForm] = useState<ChargerForm>({
    name: '',
    site: new URLSearchParams(window.location.search).get('stationId') || '',
    type: 'AC',
    power: 22,
    connectors: [{ type: 'type2', maxPower: 22 }],
    serialNumber: '',
    manufacturer: '',
    model: '',
    firmware: '',
    ocppId: '',
    networkSSID: '',
    networkPassword: '',
  })
  const [provisioning, setProvisioning] = useState(false)
  const [complete, setComplete] = useState(false)
  const [ack, setAck] = useState('')
  const [error, setError] = useState('')

  const { data: fetchStations, isLoading: loadingStations } = useStations()
  const createChargePointMutation = useCreateChargePoint()

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const updateForm = <K extends keyof ChargerForm>(key: K, value: ChargerForm[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const addConnector = () => {
    const available = getAvailableConnectors(form.type)
    const defaultConnector = available[0]?.key || 'type2'
    const defaultPower = getConnectorMaxPower(defaultConnector, form.type)
    setForm(f => ({
      ...f,
      connectors: [...f.connectors, { type: defaultConnector, maxPower: Math.min(defaultPower, f.power) }]
    }))
  }

  const removeConnector = (idx: number) => {
    setForm(f => ({
      ...f,
      connectors: f.connectors.filter((_, i) => i !== idx)
    }))
  }

  const updateConnector = (idx: number, field: 'type' | 'maxPower', value: any) => {
    setForm(f => ({
      ...f,
      connectors: f.connectors.map((c, i) => i === idx ? { ...c, [field]: value } : c)
    }))
  }

  // Simulation of "Connecting" to the hardware
  const simulateConnection = () => {
    setConnectionState('scanning')
    setTimeout(() => {
      setConnectionState('discovered')
    }, 2500)
  }

  // Simulation of "Pushing Config" and "Auto-Filling"
  const pushConfigAndDiscover = () => {
    setConnectionState('connecting')
    setTimeout(() => {
      setConnectionState('connected')
      // Auto-fill logic mock
      setForm(f => ({
        ...f,
        manufacturer: 'ABB',
        model: 'Terra AC Wallbox',
        serialNumber: 'TACW-2025-8921',
        firmware: 'v1.4.2',
        ocppId: 'CP-TACW-8921',
        type: 'AC',
        power: 22,
        connectors: [{ type: 'type2', maxPower: 22 }]
      }))
      toast('Charger configured and details retrieved!')
      handleNext()
    }, 3000)
  }

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.site
      case 1: return connectionState === 'discovered' // Must have found the charger
      case 2: return connectionState === 'connected' // Must have pushed config
      case 3: return !!form.serialNumber && !!form.manufacturer && !!form.model // Details check
      default: return true
    }
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1)
    }
  }

  const handleProvision = async () => {
    setProvisioning(true)
    setError('')
    try {
      // Create charge point with connectors
      const chargePoint = await createChargePointMutation.mutateAsync({
        stationId: form.site,
        model: form.model,
        manufacturer: form.manufacturer,
        serialNumber: form.serialNumber,
        firmwareVersion: form.firmware,
        connectors: form.connectors.map((c, idx) => {
          const spec = CONNECTOR_SPECS.find(cs => cs.key === c.type)
          return {
            type: spec?.displayName || c.type,
            powerType: form.type,
            maxPowerKw: c.maxPower,
          }
        }),
        ocppId: form.ocppId,
      })
      auditLogger.chargePointCreated(chargePoint.id, form.site)
      setProvisioning(false)
      setComplete(true)
      toast('Charger provisioned successfully!')
    } catch (err) {
      setError(getErrorMessage(err))
      setProvisioning(false)
    }
  }

  if (!canAdd) {
    return (
      <DashboardLayout pageTitle="Add Charger">
        <div className="p-8 text-center text-subtle">No permission to add chargers.</div>
      </DashboardLayout>
    )
  }

  if (complete) {
    return (
      <DashboardLayout pageTitle="Add Charger">
        <div className="max-w-2xl mx-auto py-12">
          <div className="rounded-xl bg-surface border border-border p-8 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Charger Provisioned!</h2>
            <p className="text-subtle mb-4">
              {form.name || 'Your charger'} at {fetchStations?.find(s => s.id === form.site)?.name || 'the selected site'} has been successfully provisioned.
            </p>
            <p className="text-sm text-subtle mb-6">
              OCPP ID: <code className="bg-muted px-2 py-0.5 rounded">{form.ocppId}</code>
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="/charge-points" className="px-4 py-2 rounded-lg border border-border hover:bg-muted">View All Chargers</a>
              <button onClick={() => { setComplete(false); setStep(0); setForm({ name: '', site: '', type: 'AC', power: 22, connectors: [{ type: 'type2', maxPower: 22 }], serialNumber: '', manufacturer: '', model: '', firmware: '', ocppId: '', networkSSID: '', networkPassword: '' }) }} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">Add Another</button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Add Charger">
      <div className="max-w-3xl mx-auto space-y-6">
        {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}
        {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${i < step ? 'bg-accent text-white' : i === step ? 'bg-accent text-white ring-4 ring-accent/20' : 'bg-muted text-subtle'
                }`}>
                {i < step ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg> : i + 1}
              </div>
              <span className={`ml-2 text-sm ${i <= step ? 'font-medium' : 'text-subtle'}`}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`mx-4 h-0.5 w-12 ${i < step ? 'bg-accent' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-xl bg-surface border border-border p-6">
          {/* Step 0: Site */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Installation Site</h3>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Site *</span>
                <select value={form.site} onChange={e => updateForm('site', e.target.value)} className="select" disabled={loadingStations}>
                  <option value="">{loadingStations ? 'Loading sites...' : 'Choose a site...'}</option>
                  {fetchStations?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Charger Name (optional)</span>
                <input value={form.name} onChange={e => updateForm('name', e.target.value)} className="input" placeholder="e.g., Charger A1" />
              </label>
            </div>
          )}

          {/* Step 1: Connect to Charger */}
          {step === 1 && (
            <div className="space-y-6 text-center py-8">
              {connectionState === 'idle' && (
                <>
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /><path d="M11 14h2" /></svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connect to Charger</h3>
                  <p className="text-subtle max-w-md mx-auto mb-8">
                    Please ensure the charger is powered on. Your device needs to connect to the charger's temporary Wi-Fi network to configure it.
                  </p>
                  <button onClick={simulateConnection} className="btn primary">
                    Search for Charger
                  </button>
                </>
              )}

              {connectionState === 'scanning' && (
                <div className="py-8">
                  <div className="animate-spin h-10 w-10 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-lg font-medium">Scanning for nearby devices...</p>
                </div>
              )}

              {connectionState === 'discovered' && (
                <div className="py-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-4 animate-bounce">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-500 mb-1">Charger Found!</h3>
                  <p className="text-xl font-bold mb-6">EV-SETUP-8921</p>
                  <p className="text-subtle mb-0">Device is ready to be configured.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Network Configuration */}
          {step === 2 && (
            <div className="space-y-4">
              {connectionState === 'connecting' ? (
                <div className="text-center py-12">
                  <div className="animate-pulse h-16 w-16 bg-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Configuring Charger...</h3>
                  <p className="text-subtle">Pushing Wi-Fi credentials and retrieving technical details.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">Configure Charger Network</h3>
                  <p className="text-sm text-subtle mb-4">Enter the local Wi-Fi credentials for the charger to connect to the internet.</p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="grid gap-1">
                      <span className="text-sm font-medium">Wi-Fi SSID *</span>
                      <input value={form.networkSSID} onChange={e => updateForm('networkSSID', e.target.value)} className="input" placeholder="e.g. MyOffice_Guest" />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-sm font-medium">Wi-Fi Password *</span>
                      <input type="password" value={form.networkPassword} onChange={e => updateForm('networkPassword', e.target.value)} className="input" />
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={pushConfigAndDiscover}
                      disabled={!form.networkSSID}
                      className="btn primary"
                    >
                      Push Config & Connect
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Charger Details (Auto-filled + Connectors) */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h4 className="font-semibold text-green-500 text-sm">Details Auto-Retrieved</h4>
                  <p className="text-xs text-green-500/80">The system has successfully identified the charger model and serial number.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Manufacturer</span>
                  <input value={form.manufacturer} readOnly className="input bg-muted/50 cursor-not-allowed" />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Model</span>
                  <input value={form.model} readOnly className="input bg-muted/50 cursor-not-allowed" />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Serial Number</span>
                  <input value={form.serialNumber} readOnly className="input bg-muted/50 cursor-not-allowed" />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-medium">Firmware</span>
                  <input value={form.firmware} readOnly className="input bg-muted/50 cursor-not-allowed" />
                </label>
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Connectors & Power</span>
                  <button type="button" onClick={addConnector} className="text-sm text-accent hover:underline">+ Add Connector</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <label className="grid gap-1">
                    <span className="text-sm font-medium">Max Unit Power (kW)</span>
                    <input type="number" value={form.power} onChange={e => updateForm('power', parseInt(e.target.value) || 0)} className="input" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm font-medium">OCPP ID</span>
                    <input value={form.ocppId} onChange={e => updateForm('ocppId', e.target.value)} className="input" />
                  </label>
                </div>

                <div className="space-y-3">
                  {form.connectors.map((c, i) => {
                    const connectorSpec = CONNECTOR_SPECS.find(cs => cs.key === c.type)
                    const availableConnectors = getAvailableConnectors(form.type)
                    return (
                      <div key={i} className="border border-white/5 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={c.type}
                            onChange={e => {
                              const newType = e.target.value
                              const maxPower = getConnectorMaxPower(newType, form.type)
                              updateConnector(i, 'type', newType)
                              updateConnector(i, 'maxPower', Math.min(maxPower, form.power))
                            }}
                            className="select flex-1"
                          >
                            {availableConnectors.map(conn => (
                              <option key={conn.key} value={conn.key}>{conn.displayName}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={c.maxPower}
                            onChange={e => updateConnector(i, 'maxPower', parseInt(e.target.value) || 0)}
                            className="input w-24"
                            max={getConnectorMaxPower(c.type, form.type)}
                          />
                          <span className="text-sm text-subtle">kW</span>
                          {form.connectors.length > 1 && (
                            <button type="button" onClick={() => removeConnector(i)} className="text-red-600 hover:text-red-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                        {connectorSpec && (
                          <div className="text-xs text-subtle flex flex-wrap gap-x-4 gap-y-1">
                            <span>Standards: {connectorSpec.standards.join(', ')}</span>
                            <span>Regions: {connectorSpec.commonRegions.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Provision</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><div className="text-subtle">Site</div><div className="font-medium">{form.site}</div></div>
                <div><div className="text-subtle">Name</div><div className="font-medium">{form.name || '—'}</div></div>
                <div><div className="text-subtle">Type</div><div className="font-medium">{form.type} • {form.power} kW</div></div>
                <div><div className="text-subtle">Manufacturer / Model</div><div className="font-medium">{form.manufacturer} {form.model}</div></div>
                <div><div className="text-subtle">Serial Number</div><div className="font-medium">{form.serialNumber}</div></div>
                <div><div className="text-subtle">OCPP ID</div><div className="font-medium font-mono">{form.ocppId}</div></div>
              </div>
              <div>
                <div className="text-sm text-subtle mb-2">Connectors</div>
                <div className="flex flex-wrap gap-2">
                  {form.connectors.map((c, i) => {
                    const spec = CONNECTOR_SPECS.find(cs => cs.key === c.type)
                    return (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                        {spec?.displayName || c.type} • {c.maxPower} kW
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={handleBack} disabled={step === 0} className={`px-4 py-2 rounded-lg border border-border ${step === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} disabled={!canProceed()} className={`px-6 py-2 rounded-lg font-medium ${canProceed() ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-gray-300 cursor-not-allowed'}`}>
              Next
            </button>
          ) : (
            <button onClick={handleProvision} disabled={provisioning} className="px-6 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover disabled:opacity-50">
              {provisioning ? 'Provisioning...' : 'Provision Charger'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AddCharger


