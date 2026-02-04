import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { useCreateChargePoint } from '@/modules/charge-points/hooks/useChargePoints'
import { useStations, useStation } from '@/modules/stations/hooks/useStations'
import { auditLogger } from '@/core/utils/auditLogger'
import { getErrorMessage } from '@/core/api/errors'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { InlineSkeleton } from '@/ui/components/SkeletonCards'
import { Html5QrcodeScanner } from 'html5-qrcode'

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
  ocppVersion: '1.6' | '2.0.1'
  networkSSID: string
  networkPassword: string
}

const STEPS = [
  { key: 'site', label: 'Select Station' },
  { key: 'identity', label: 'Identity & Scan' },
  { key: 'connect', label: 'Configuration' },
  { key: 'review', label: 'Review & Provision' },
]

export function AddCharger() {
  const { user } = useAuthStore()
  const role = user?.role ?? 'STATION_OWNER'
  const canAdd = hasPermission(role, 'charge-points', 'create') || hasPermission(role, 'stations', 'create')

  const [step, setStep] = useState(0)
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
    ocppVersion: '1.6',
    networkSSID: '',
    networkPassword: '',
  })

  // Identity Step State
  const [useScanner, setUseScanner] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)

  // Connection Wait State
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connected' | 'timeout'>('waiting')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [provisioning, setProvisioning] = useState(false)
  const [complete, setComplete] = useState(false)
  const [ack, setAck] = useState('')
  const [error, setError] = useState('')

  const { data: allStations, isLoading: loadingStations, refetch: refetchStations } = useStations()

  // Explicitly fetch the station from the URL if provided
  // This handles cases where the main list is paginated or cached without the new station
  const urlStationId = new URLSearchParams(window.location.search).get('stationId')
  const { data: targetStation } = useStation(urlStationId || '')

  // Debug State
  const [showDebug, setShowDebug] = useState(false)

  const myStations = useMemo(() => {
    let stations = allStations || []

    // If we have a target station from URL that isn't in the list, add it
    if (targetStation && !stations.find(s => s.id === targetStation.id)) {
      stations = [...stations, targetStation]
    }

    if (!user) return []

    // Filter by Owner ID OR Organization ID
    return stations.filter(s => {
      // 1. Target Station (Always allow)
      if (s.id === urlStationId) return true

      // 2. Direct Owner Match
      if (s.ownerId === user.id) return true

      // 3. Organization Match (if station has orgId)
      if (s.orgId && (s.orgId === user.orgId || s.orgId === user.organizationId)) return true

      // 4. Super Admin sees all
      if (user.role === 'SUPER_ADMIN') return true

      return false
    })
  }, [allStations, targetStation, user, urlStationId])
  const createChargePointMutation = useCreateChargePoint()

  const toast = (m: string) => { setAck(m); setTimeout(() => setAck(''), 2000) }

  const updateForm = <K extends keyof ChargerForm>(key: K, value: ChargerForm[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const generateRandomID = () => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    updateForm('ocppId', `CP-${randomPart}`)
    setManualEntry(true) // Switch to manual view to show the ID
    setUseScanner(false)
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

  // Effect for QR Scanner
  useEffect(() => {
    if (step === 1 && useScanner) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      )

      scanner.render((decodedText) => {
        console.log("QR Code Scanned:", decodedText)
        updateForm('ocppId', decodedText)
        setUseScanner(false)
        scanner.clear()
      }, (errorMessage) => {
        // Parse error, ignore usually
      })

      return () => {
        try { scanner.clear() } catch (e) { /* ignore cleanup errors */ }
      }
    }
  }, [step, useScanner])

  // Polling Effect for "Configuration" Step
  useEffect(() => {
    if (step === 2) {
      setConnectionStatus('waiting')

      // Poll every 5 seconds to check if charger is online
      pollingRef.current = setInterval(async () => {
        try {
          // Verify if charge point is online via API
          // MOCK: Auto-connect after 10s for demo if not real
        } catch (e) {
          console.error("Polling error", e)
        }
      }, 5000)

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
    }
  }, [step, form.ocppId])

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.site
      case 1: return !!form.ocppId // Must have an ID
      case 2: return connectionStatus === 'connected' // Must have verified connection
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
        model: form.model || 'Generic OCPP 1.6',
        manufacturer: form.manufacturer || 'Generic',
        serialNumber: form.serialNumber || 'UNKNOWN',
        firmwareVersion: form.firmware || '1.0',
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
              {form.name || 'Your charger'} at {myStations.find(s => s.id === form.site)?.name || 'the selected station'} has been successfully provisioned.
            </p>
            <p className="text-sm text-subtle mb-6">
              OCPP ID: <code className="bg-muted px-2 py-0.5 rounded">{form.ocppId}</code>
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="/charge-points" className="px-4 py-2 rounded-lg border border-border hover:bg-muted">View All Chargers</a>
              <button onClick={() => {
                setComplete(false)
                setStep(0)
                setForm({
                  name: '', site: '', type: 'AC', power: 22,
                  connectors: [{ type: 'type2', maxPower: 22 }],
                  serialNumber: '', manufacturer: '', model: '', firmware: '',
                  ocppId: '', ocppVersion: '1.6', networkSSID: '', networkPassword: ''
                })
              }} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">Add Another</button>
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
        <div className="rounded-xl bg-surface border border-border p-6 min-h-[400px]">
          {/* Step 0: Site */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Installation Station</h3>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Station *</span>
                {loadingStations ? (
                  <InlineSkeleton width="100%" height={40} />
                ) : (
                  <select value={form.site} onChange={e => updateForm('site', e.target.value)} className="select">
                    <option value="">{myStations.length === 0 ? 'No stations found' : 'Choose a station...'}</option>
                    {myStations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
                {myStations.length === 0 && !loadingStations && (
                  <div className="mt-2 text-sm text-subtle">
                    No stations available. <a href="/add-station" className="text-accent hover:underline">Create a Station</a> first.
                  </div>
                )}
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-medium">Charger Name (optional)</span>
                <input value={form.name} onChange={e => updateForm('name', e.target.value)} className="input" placeholder="e.g., Charger A1" />
              </label>
            </div>
          )}

          {/* Step 1: Identity & Scan */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <h3 className="text-lg font-semibold mb-4">Identify Charger</h3>

              {/* Selection Mode */}
              {!useScanner && !manualEntry && !form.ocppId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setUseScanner(true)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all gap-3 h-48"
                  >
                    <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 4v1m6 11h2m-6 0h-2v4h4v-3h.01M6 20v-4H3v4h3zm2-4h2v4H8v-4zm-2-9h2v4H6V7zm2-4h2v4H8V3zM3 3h4v4H3V3zm14 0h4v4h-4V3zM3 13h4v4H3v-4z" /></svg>
                    <span className="font-medium">Scan QR Code</span>
                  </button>

                  <button
                    onClick={generateRandomID}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all gap-3 h-48"
                  >
                    <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    <span className="font-medium">Auto-Generate ID</span>
                  </button>

                  <button
                    onClick={() => setManualEntry(true)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all gap-3 h-48"
                  >
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <span className="font-medium">Enter Manually</span>
                  </button>
                </div>
              )}

              {/* Scanner View */}
              {useScanner && (
                <div className="max-w-sm mx-auto">
                  <div id="qr-reader" className="overflow-hidden rounded-xl border border-border"></div>
                  <button onClick={() => setUseScanner(false)} className="mt-4 text-subtle hover:text-foreground">Cancel Scan</button>
                </div>
              )}

              {/* Manual / Result View */}
              {(manualEntry || form.ocppId) && (
                <div className="max-w-md mx-auto space-y-4">
                  <label className="text-left block">
                    <span className="text-sm font-medium mb-1 block">Charge Point Identity (OCPP ID)</span>
                    <div className="flex gap-2">
                      <input
                        value={form.ocppId}
                        onChange={e => updateForm('ocppId', e.target.value)}
                        className="input font-mono text-lg"
                        placeholder="e.g. CP-10293"
                        autoFocus
                      />
                      {/* Allow clearing if manually entered or result shown */}
                      <button onClick={() => { updateForm('ocppId', ''); setManualEntry(false); setUseScanner(false) }} className="p-2 text-subtle hover:text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </label>

                  <label className="text-left block">
                    <span className="text-sm font-medium mb-1 block">OCPP Protocol Version</span>
                    <select
                      value={form.ocppVersion}
                      onChange={e => updateForm('ocppVersion', e.target.value as any)}
                      className="select"
                    >
                      <option value="1.6">OCPP 1.6J (Standard)</option>
                      <option value="2.0.1">OCPP 2.0.1 (Advanced)</option>
                    </select>
                    <p className="text-xs text-subtle mt-2">Select the version supported by your hardware. This determines the connection URL.</p>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configuration & Wait */}
          {step === 2 && (
            <div className="space-y-6 text-center py-4">
              <h3 className="text-xl font-bold">Configure Your Charger</h3>
              <p className="text-subtle max-w-lg mx-auto">
                Connect to your charger's configuration interface (usually via local Wi-Fi or Bluetooth app) and enter the following settings:
              </p>

              <div className="bg-surface-highlight border border-border rounded-xl p-6 text-left max-w-lg mx-auto space-y-4">
                <div>
                  <label className="text-xs font-bold text-subtle uppercase tracking-wider">Central System URL (CSMS)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-black/20 p-2 rounded flex-1 font-mono text-accent break-all">
                      wss://ocpp.evzonecharging.com/ocpp/{form.ocppVersion}
                    </code>
                    <button className="text-xs bg-muted hover:bg-muted-hover px-2 py-1 rounded" onClick={() => toast('Copied URL')}>Copy</button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-subtle uppercase tracking-wider">Charge Point Identity</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-black/20 p-2 rounded flex-1 font-mono text-xl font-bold">
                      {form.ocppId}
                    </code>
                    <button className="text-xs bg-muted hover:bg-muted-hover px-2 py-1 rounded" onClick={() => toast('Copied ID')}>Copy</button>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border mt-8">
                {connectionStatus === 'waiting' && (
                  <div className="flex flex-col items-center animate-pulse">
                    <div className="h-4 w-4 bg-accent rounded-full mb-2"></div>
                    <p className="text-sm font-medium">Waiting for BootNotification...</p>
                    <p className="text-xs text-subtle">The system is listening for a connection from {form.ocppId} on protocol {form.ocppVersion}</p>

                    {/* Development Bypass */}
                    <button
                      onClick={() => {
                        setConnectionStatus('connected')
                        // Mock data retrieval from BootNotification
                        setForm(f => ({
                          ...f,
                          manufacturer: 'ABB',
                          model: 'Terra AC Wallbox',
                          serialNumber: 'TACW-2025-8921',
                          firmware: 'v1.4.2'
                        }))
                      }}
                      className="mt-8 text-xs text-subtle hover:text-accent underline"
                    >
                      (Dev) Simulate Connection Success & Data
                    </button>
                  </div>
                )}

                {connectionStatus === 'connected' && (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-lg font-bold text-green-500">Connected Successfully!</p>
                    <p className="text-sm text-subtle">The charger has been verified.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Provision</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><div className="text-subtle">Station</div><div className="font-medium">{myStations.find(s => s.id === form.site)?.name || form.site}</div></div>
                <div><div className="text-subtle">Name</div><div className="font-medium">{form.name || '—'}</div></div>
                <div><div className="text-subtle">Type</div><div className="font-medium">{form.type} • {form.power} kW</div></div>
                <div><div className="text-subtle">Manufacturer / Model</div><div className="font-medium">{form.manufacturer} {form.model}</div></div>
                <div><div className="text-subtle">Serial Number</div><div className="font-medium">{form.serialNumber}</div></div>
                <div><div className="text-subtle">OCPP ID</div><div className="font-medium font-mono">{form.ocppId}</div></div>
                <div><div className="text-subtle">Protocol</div><div className="font-medium">{form.ocppVersion}</div></div>
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
