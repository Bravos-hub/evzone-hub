import { useState } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

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
  { key: 'type', label: 'Charger Type' },
  { key: 'specs', label: 'Specifications' },
  { key: 'network', label: 'Network Setup' },
  { key: 'review', label: 'Review & Provision' },
]

export function AddCharger() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'OWNER'
  const canAdd = hasPermission(role, 'charge-points', 'create') || hasPermission(role, 'stations', 'create')

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ChargerForm>({
    name: '',
    site: '',
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

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.site
      case 1: return !!form.type && form.power > 0
      case 2: return !!form.serialNumber && !!form.manufacturer && !!form.model
      case 3: return !!form.ocppId
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
    // Simulate provisioning
    await new Promise(r => setTimeout(r, 2000))
    setProvisioning(false)
    setComplete(true)
  }

  if (!canAdd) {
    return <div className="p-8 text-center text-subtle">No permission to add chargers.</div>
  }

  if (complete) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="rounded-xl bg-surface border border-border p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Charger Provisioned!</h2>
          <p className="text-subtle mb-4">
            {form.name || 'Your charger'} at {form.site} has been successfully provisioned.
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
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {ack && <div className="rounded-lg bg-accent/10 text-accent px-4 py-2 text-sm">{ack}</div>}

      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
              i < step ? 'bg-accent text-white' : i === step ? 'bg-accent text-white ring-4 ring-accent/20' : 'bg-muted text-subtle'
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
              <select value={form.site} onChange={e => updateForm('site', e.target.value)} className="select">
                <option value="">Choose a site...</option>
                <option>Central Hub</option>
                <option>Airport East</option>
                <option>Tech Park</option>
                <option>Downtown Garage</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Charger Name (optional)</span>
              <input value={form.name} onChange={e => updateForm('name', e.target.value)} className="input" placeholder="e.g., Charger A1" />
            </label>
          </div>
        )}

        {/* Step 1: Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Charger Type & Power</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Charger Type *</span>
                <select 
                  value={form.type} 
                  onChange={e => {
                    const newType = e.target.value as ChargerType
                    const available = getAvailableConnectors(newType)
                    const defaultConnector = available[0]?.key || 'type2'
                    const defaultPower = newType === 'DC' ? 150 : 22
                    updateForm('type', newType)
                    updateForm('power', defaultPower)
                    setForm(f => ({
                      ...f,
                      type: newType,
                      power: defaultPower,
                      connectors: [{ type: defaultConnector, maxPower: defaultPower }]
                    }))
                  }} 
                  className="select"
                >
                  <option value="AC">AC (Level 2)</option>
                  <option value="DC">DC Fast Charging</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Max Power (kW) *</span>
                <input type="number" value={form.power} onChange={e => updateForm('power', parseInt(e.target.value) || 0)} className="input" min="1" max={form.type === 'DC' ? 3750 : 350} />
              </label>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Connectors</span>
                <button type="button" onClick={addConnector} className="text-sm text-accent hover:underline">+ Add Connector</button>
              </div>
              <div className="space-y-3">
                {form.connectors.map((c, i) => {
                  const connectorSpec = CONNECTOR_SPECS.find(cs => cs.key === c.type)
                  const availableConnectors = getAvailableConnectors(form.type)
                  return (
                    <div key={i} className="bg-muted rounded-lg p-3 space-y-2">
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
                          {form.type === 'DC' && connectorSpec.dcRatings && (
                            <span>Max: {connectorSpec.dcRatings.voltageMaxV}V{connectorSpec.dcRatings.currentMaxA ? ` / ${connectorSpec.dcRatings.currentMaxA}A` : ''}</span>
                          )}
                          {form.type === 'AC' && connectorSpec.acRatings && (
                            <span>Max: {connectorSpec.acRatings.phases} {connectorSpec.acRatings.voltageMaxV}V / {connectorSpec.acRatings.currentMaxA}A</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Specifications */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hardware Specifications</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Manufacturer *</span>
                <select value={form.manufacturer} onChange={e => updateForm('manufacturer', e.target.value)} className="select">
                  <option value="">Select...</option>
                  <option>ABB</option>
                  <option>ChargePoint</option>
                  <option>EVBox</option>
                  <option>Schneider Electric</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Model *</span>
                <input value={form.model} onChange={e => updateForm('model', e.target.value)} className="input" placeholder="e.g., Terra 54" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Serial Number *</span>
                <input value={form.serialNumber} onChange={e => updateForm('serialNumber', e.target.value)} className="input" placeholder="e.g., SN-2025-001234" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Firmware Version</span>
                <input value={form.firmware} onChange={e => updateForm('firmware', e.target.value)} className="input" placeholder="e.g., 1.2.3" />
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Network */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Network & OCPP Configuration</h3>
            <label className="grid gap-1">
              <span className="text-sm font-medium">OCPP Charge Point ID *</span>
              <input value={form.ocppId} onChange={e => updateForm('ocppId', e.target.value)} className="input" placeholder="e.g., CP-CENTRALHUB-A1" />
              <span className="text-xs text-subtle">This ID will be used to identify the charger in the OCPP backend</span>
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium">WiFi SSID (optional)</span>
                <input value={form.networkSSID} onChange={e => updateForm('networkSSID', e.target.value)} className="input" />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">WiFi Password (optional)</span>
                <input type="password" value={form.networkPassword} onChange={e => updateForm('networkPassword', e.target.value)} className="input" />
              </label>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm font-medium mb-2">OCPP Backend URL</div>
              <code className="text-xs bg-surface px-2 py-1 rounded block">wss://ocpp.evzone.io/v1.6/{form.ocppId || 'YOUR_CHARGER_ID'}</code>
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
  )
}

export default AddCharger

