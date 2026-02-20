import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'
import { PATHS } from '@/app/router/paths'
import { useCreateChargePoint } from '@/modules/charge-points/hooks/useChargePoints'
import { chargePointService } from '@/modules/charge-points/services/chargePointService'
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
type OcppVersion = '1.6' | '2.0.1' | '2.1'
type AuthProfile = 'basic' | 'mtls_bootstrap'

type OcppCredentials = {
  username: string
  password: string
  wsUrl: string
  subprotocol: 'ocpp1.6' | 'ocpp2.0.1' | 'ocpp2.1'
  authProfile?: 'basic' | 'mtls_bootstrap' | 'mtls'
  bootstrapExpiresAt?: string
  requiresClientCertificate?: boolean
  mtlsInstructions?: string
}

type BootProof = {
  updatedAt?: string
  model?: string
  vendor?: string
  firmwareVersion?: string
}

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

const versionSubprotocol = (version: OcppVersion): OcppCredentials['subprotocol'] => {
  if (version === '2.0.1') return 'ocpp2.0.1'
  if (version === '2.1') return 'ocpp2.1'
  return 'ocpp1.6'
}

const fallbackWsBaseUrl = (() => {
  const configured = import.meta.env.VITE_OCPP_PUBLIC_WS_BASE_URL as string | undefined
  const normalized = (configured || 'wss://ocpp.evzonecharging.com').trim().replace(/\/+$/, '')
  return /^wss?:\/\//i.test(normalized) ? normalized : 'wss://ocpp.evzonecharging.com'
})()

const wsUrlFor = (version: OcppVersion, ocppId: string) => `${fallbackWsBaseUrl}/ocpp/${version}/${ocppId}`
const splitAllowlist = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map(entry => entry.trim())
        .filter(Boolean)
    )
  )

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
  ocppVersion: OcppVersion
  authProfile: AuthProfile
  allowedIpsText: string
  allowedCidrsText: string
  bootstrapTtlMinutes: number | ''
  networkSSID: string
  networkPassword: string
}

const STEPS = [
  { key: 'site', label: 'Select Station' },
  { key: 'identity', label: 'Identity & Scan' },
  { key: 'connect', label: 'Configuration' },
  { key: 'review', label: 'Review & Finish' },
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
    authProfile: 'basic',
    allowedIpsText: '',
    allowedCidrsText: '',
    bootstrapTtlMinutes: 30,
    networkSSID: '',
    networkPassword: '',
  })

  // Identity Step State
  const [useScanner, setUseScanner] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)

  // Connection Wait State
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connected' | 'timeout'>('waiting')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [provisioning, setProvisioning] = useState(false)
  const [complete, setComplete] = useState(false)
  const [ack, setAck] = useState('')
  const [error, setError] = useState('')
  const [pollingNonce, setPollingNonce] = useState(0)
  const [provisionedChargePointId, setProvisionedChargePointId] = useState('')
  const [credentials, setCredentials] = useState<OcppCredentials | null>(null)
  const [bootProof, setBootProof] = useState<BootProof | null>(null)
  const [certificateFingerprint, setCertificateFingerprint] = useState('')
  const [bindingCertificate, setBindingCertificate] = useState(false)

  const { data: allStations, isLoading: loadingStations } = useStations()

  // Explicitly fetch the station from the URL if provided
  // This handles cases where the main list is paginated or cached without the new station
  const urlStationId = new URLSearchParams(window.location.search).get('stationId')
  const { data: targetStation } = useStation(urlStationId || '')

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

  const bootstrapAllowedIps = useMemo(() => splitAllowlist(form.allowedIpsText), [form.allowedIpsText])
  const bootstrapAllowedCidrs = useMemo(() => splitAllowlist(form.allowedCidrsText), [form.allowedCidrsText])
  const bootstrapExpiresAt = credentials?.bootstrapExpiresAt || ''
  const bootstrapRemainingMs = bootstrapExpiresAt ? Date.parse(bootstrapExpiresAt) - Date.now() : 0
  const bootstrapExpired = Boolean(bootstrapExpiresAt) && bootstrapRemainingMs <= 0
  const bootstrapMinutesLeft = bootstrapExpiresAt
    ? Math.max(0, Math.ceil(Math.max(0, bootstrapRemainingMs) / 60000))
    : 0

  const resetWizard = () => {
    setStep(0)
    setConnectionStatus('waiting')
    setProvisionedChargePointId('')
    setCredentials(null)
    setBootProof(null)
    setPollingNonce(0)
    setError('')
    setUseScanner(false)
    setManualEntry(false)
    setForm({
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
      ocppVersion: '1.6',
      authProfile: 'basic',
      allowedIpsText: '',
      allowedCidrsText: '',
      bootstrapTtlMinutes: 30,
      networkSSID: '',
      networkPassword: '',
    })
    setCertificateFingerprint('')
    setBindingCertificate(false)
  }

  const generateRandomID = () => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    updateForm('ocppId', `CP-${randomPart}`)
    setManualEntry(true) // Switch to manual view to show the ID
    setUseScanner(false)
  }

  // Effect for QR Scanner
  useEffect(() => {
    if (step === 1 && useScanner && !provisionedChargePointId) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )

      scanner.render((decodedText) => {
        updateForm('ocppId', decodedText)
        setUseScanner(false)
        scanner.clear()
      }, () => {
        // Ignore scanner parse noise
      })

      return () => {
        try { scanner.clear() } catch { /* noop */ }
      }
    }
  }, [step, useScanner, provisionedChargePointId])

  // Polling effect for real BootNotification proof
  useEffect(() => {
    if (step !== 2 || !provisionedChargePointId || !form.ocppId) {
      return
    }

    let disposed = false
    setConnectionStatus('waiting')

    const clearTimers = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const pollConnection = async () => {
      try {
        const chargePoint = await chargePointService.getByOcppId(form.ocppId)
        if (!chargePoint || disposed) return

        if (String(chargePoint.status || '').toLowerCase() === 'online') {
          clearTimers()
          setConnectionStatus('connected')
          setBootProof({
            updatedAt: chargePoint.updatedAt,
            model: chargePoint.model,
            vendor: chargePoint.vendor || chargePoint.manufacturer,
            firmwareVersion: chargePoint.firmwareVersion,
          })
          setForm(f => ({
            ...f,
            model: chargePoint.model || f.model,
            manufacturer: chargePoint.vendor || chargePoint.manufacturer || f.manufacturer,
            firmware: chargePoint.firmwareVersion || f.firmware,
            serialNumber: chargePoint.serialNumber || f.serialNumber,
          }))
        }
      } catch {
        // keep waiting; timeout handles surfaced failure
      }
    }

    void pollConnection()
    pollingRef.current = setInterval(() => {
      void pollConnection()
    }, 3000)

    timeoutRef.current = setTimeout(() => {
      if (disposed) return
      setConnectionStatus(prev => prev === 'connected' ? prev : 'timeout')
      clearTimers()
    }, 120000)

    return () => {
      disposed = true
      clearTimers()
    }
  }, [step, form.ocppId, provisionedChargePointId, pollingNonce])

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.site
      case 1:
        if (!form.ocppId) return false
        if (form.authProfile === 'mtls_bootstrap') {
          return bootstrapAllowedIps.length > 0 || bootstrapAllowedCidrs.length > 0
        }
        return true
      case 2: return connectionStatus === 'connected'
      default: return true
    }
  }

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(successMessage)
    } catch {
      setError('Copy failed. Please copy manually.')
    }
  }

  const startProvisioning = async () => {
    setProvisioning(true)
    setError('')
    if (
      form.authProfile === 'mtls_bootstrap'
      && bootstrapAllowedIps.length === 0
      && bootstrapAllowedCidrs.length === 0
    ) {
      setProvisioning(false)
      setError('For mTLS onboarding, provide at least one allowed IP or CIDR.')
      return false
    }
    try {
      const chargePoint = await createChargePointMutation.mutateAsync({
        stationId: form.site,
        model: form.model || 'Generic OCPP Charger',
        manufacturer: form.manufacturer || 'Generic',
        serialNumber: form.serialNumber || 'UNKNOWN',
        firmwareVersion: form.firmware || '1.0',
        connectors: form.connectors.map((c) => {
          const spec = CONNECTOR_SPECS.find(cs => cs.key === c.type)
          return {
            type: spec?.displayName || c.type,
            powerType: form.type,
            maxPowerKw: c.maxPower,
          }
        }),
        ocppId: form.ocppId,
        ocppVersion: form.ocppVersion,
        authProfile: form.authProfile,
        bootstrapTtlMinutes:
          form.authProfile === 'mtls_bootstrap' && form.bootstrapTtlMinutes !== ''
            ? Number(form.bootstrapTtlMinutes)
            : undefined,
        allowedIps: form.authProfile === 'mtls_bootstrap' ? bootstrapAllowedIps : undefined,
        allowedCidrs: form.authProfile === 'mtls_bootstrap' ? bootstrapAllowedCidrs : undefined,
      })

      const oneTimeCredentials: OcppCredentials = chargePoint.ocppCredentials || {
        username: form.ocppId,
        password: '',
        wsUrl: wsUrlFor(form.ocppVersion, form.ocppId),
        subprotocol: versionSubprotocol(form.ocppVersion),
        authProfile: form.authProfile,
      }

      setProvisionedChargePointId(chargePoint.id)
      setCredentials(oneTimeCredentials)
      setBootProof(null)
      setConnectionStatus('waiting')
      setPollingNonce(prev => prev + 1)
      auditLogger.chargePointCreated(chargePoint.id, form.site)
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    } finally {
      setProvisioning(false)
    }
  }

  const handleNext = async () => {
    if (step === 1 && !provisionedChargePointId) {
      const ok = await startProvisioning()
      if (ok) setStep(2)
      return
    }

    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1)
    }
  }

  const handleFinish = () => {
    setComplete(true)
    toast('Onboarding completed successfully')
  }

  const retryConnectionCheck = () => {
    setError('')
    setConnectionStatus('waiting')
    setPollingNonce(prev => prev + 1)
  }

  const handleManualCertificateBind = async () => {
    if (!provisionedChargePointId || !certificateFingerprint.trim()) {
      setError('Enter certificate fingerprint before submitting.')
      return
    }
    setBindingCertificate(true)
    setError('')
    try {
      const response = await chargePointService.bindCertificate(provisionedChargePointId, {
        fingerprint: certificateFingerprint.trim(),
      })
      setCredentials(prev =>
        prev
          ? { ...prev, authProfile: response.authProfile, requiresClientCertificate: true }
          : prev
      )
      setCertificateFingerprint('')
      toast('Certificate fingerprint bound. Reconnect charger with client certificate.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBindingCertificate(false)
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
            <h2 className="text-2xl font-semibold mb-2">Charger Onboarded</h2>
            <p className="text-subtle mb-4">
              {form.name || 'Your charger'} at {myStations.find(s => s.id === form.site)?.name || 'the selected station'} is fully connected.
            </p>
            <p className="text-sm text-subtle mb-6">
              OCPP ID: <code className="bg-muted px-2 py-0.5 rounded">{form.ocppId}</code>
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="/charge-points" className="px-4 py-2 rounded-lg border border-border hover:bg-muted">View All Chargers</a>
              <button onClick={() => { setComplete(false); resetWizard() }} className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover">Add Another</button>
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
                    No stations available. <a href={PATHS.OWNER.ADD_STATION_ENTRY} className="text-accent hover:underline">Create a Station</a> first.
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
              {!useScanner && !manualEntry && !form.ocppId && !provisionedChargePointId && (
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
              {useScanner && !provisionedChargePointId && (
                <div className="max-w-sm mx-auto">
                  <div id="qr-reader" className="overflow-hidden rounded-xl border border-border"></div>
                  <button onClick={() => setUseScanner(false)} className="mt-4 text-subtle hover:text-foreground">Cancel Scan</button>
                </div>
              )}

              {/* Manual / Result View */}
              {(manualEntry || form.ocppId || provisionedChargePointId) && (
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
                        disabled={!!provisionedChargePointId}
                      />
                      {!provisionedChargePointId && (
                        <button onClick={() => { updateForm('ocppId', ''); setManualEntry(false); setUseScanner(false) }} className="p-2 text-subtle hover:text-red-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                    {provisionedChargePointId && (
                      <p className="text-xs text-amber-600 mt-2">OCPP ID is locked after provisioning. Add another charger to use a different ID.</p>
                    )}
                  </label>

                  <label className="text-left block">
                    <span className="text-sm font-medium mb-1 block">OCPP Protocol Version</span>
                    <select
                      value={form.ocppVersion}
                      onChange={e => updateForm('ocppVersion', e.target.value as OcppVersion)}
                      className="select"
                      disabled={!!provisionedChargePointId}
                    >
                      <option value="1.6">OCPP 1.6J (Standard)</option>
                      <option value="2.0.1">OCPP 2.0.1 (Advanced)</option>
                      <option value="2.1">OCPP 2.1 (Ultra-Modern)</option>
                    </select>
                    <p className="text-xs text-subtle mt-2">Select the version supported by your hardware. This determines URL and subprotocol.</p>
                  </label>

                  <label className="text-left block">
                    <span className="text-sm font-medium mb-1 block">Onboarding Profile</span>
                    <select
                      value={form.authProfile}
                      onChange={e => updateForm('authProfile', e.target.value as AuthProfile)}
                      className="select"
                      disabled={!!provisionedChargePointId}
                    >
                      <option value="basic">Password (Basic)</option>
                      <option value="mtls_bootstrap">No password field (mTLS onboarding)</option>
                    </select>
                  </label>

                  {form.authProfile === 'mtls_bootstrap' && (
                    <>
                      <label className="text-left block">
                        <span className="text-sm font-medium mb-1 block">Allowed Source IPs *</span>
                        <textarea
                          value={form.allowedIpsText}
                          onChange={e => updateForm('allowedIpsText', e.target.value)}
                          className="input min-h-[90px]"
                          placeholder="e.g. 41.90.12.10, 41.90.12.11"
                          disabled={!!provisionedChargePointId}
                        />
                      </label>

                      <label className="text-left block">
                        <span className="text-sm font-medium mb-1 block">Allowed CIDRs *</span>
                        <textarea
                          value={form.allowedCidrsText}
                          onChange={e => updateForm('allowedCidrsText', e.target.value)}
                          className="input min-h-[90px]"
                          placeholder="e.g. 41.90.12.0/24"
                          disabled={!!provisionedChargePointId}
                        />
                        <p className="text-xs text-subtle mt-2">
                          Provide at least one IP or CIDR. Bootstrap is temporary and IP-restricted.
                        </p>
                      </label>

                      <label className="text-left block">
                        <span className="text-sm font-medium mb-1 block">Bootstrap TTL (minutes)</span>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={form.bootstrapTtlMinutes}
                          onChange={e => updateForm('bootstrapTtlMinutes', e.target.value === '' ? '' : Number(e.target.value))}
                          className="input"
                          disabled={!!provisionedChargePointId}
                        />
                      </label>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configuration & Wait */}
          {step === 2 && (
            <div className="space-y-6 text-center py-4">
              <h3 className="text-xl font-bold">Configure Your Charger</h3>
              <p className="text-subtle max-w-lg mx-auto">
                Connect to your charger and configure these exact OCPP settings. The portal verifies live BootNotification from your device.
              </p>

              <div className="bg-surface-highlight border border-border rounded-xl p-6 text-left max-w-lg mx-auto space-y-4">
                <div>
                  <label className="text-xs font-bold text-subtle uppercase tracking-wider">Central System URL (CSMS)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-black/20 p-2 rounded flex-1 font-mono text-accent break-all">
                      {credentials?.wsUrl || wsUrlFor(form.ocppVersion, form.ocppId)}
                    </code>
                    <button className="text-xs bg-muted hover:bg-muted-hover px-2 py-1 rounded" onClick={() => copyText(credentials?.wsUrl || wsUrlFor(form.ocppVersion, form.ocppId), 'Copied URL')}>Copy</button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-subtle uppercase tracking-wider">Subprotocol</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-black/20 p-2 rounded flex-1 font-mono text-accent break-all">
                      {credentials?.subprotocol || versionSubprotocol(form.ocppVersion)}
                    </code>
                    <button className="text-xs bg-muted hover:bg-muted-hover px-2 py-1 rounded" onClick={() => copyText(credentials?.subprotocol || versionSubprotocol(form.ocppVersion), 'Copied subprotocol')}>Copy</button>
                  </div>
                </div>

                {form.authProfile === 'basic' ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-subtle uppercase tracking-wider">OCPP Username</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-black/20 p-2 rounded flex-1 font-mono text-accent break-all">
                          {credentials?.username || form.ocppId}
                        </code>
                        <button className="text-xs bg-muted hover:bg-muted-hover px-2 py-1 rounded" onClick={() => copyText(credentials?.username || form.ocppId, 'Copied username')}>Copy</button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-subtle uppercase tracking-wider">OCPP Password (One-time)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-black/20 p-2 rounded flex-1 font-mono text-accent break-all">
                          {credentials?.password || 'Returned by backend after provisioning'}
                        </code>
                        {credentials?.password && (
                          <button className="text-xs bg-muted hover:bg-muted-hover px-2 py-1 rounded" onClick={() => copyText(credentials.password, 'Copied password')}>Copy</button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-subtle">
                      Authentication profile: <span className="font-semibold text-foreground">No-password bootstrap (temporary)</span>
                    </div>
                    <div className="text-xs text-subtle">
                      Bootstrap expiry:
                      {' '}
                      {bootstrapExpiresAt ? new Date(bootstrapExpiresAt).toLocaleString() : 'not provided'}
                      {!bootstrapExpired && bootstrapExpiresAt && (
                        <span>{` (${bootstrapMinutesLeft} min left)`}</span>
                      )}
                      {bootstrapExpired && <span className="text-amber-600"> (expired)</span>}
                    </div>
                    <div className="text-xs text-subtle">
                      Allowlist:
                      {' '}
                      {bootstrapAllowedIps.length + bootstrapAllowedCidrs.length > 0
                        ? `${bootstrapAllowedIps.length} IP(s), ${bootstrapAllowedCidrs.length} CIDR(s)`
                        : 'configured at provisioning'}
                    </div>
                    <div className="text-xs text-subtle">
                      {credentials?.mtlsInstructions || 'Complete mTLS certificate binding after first online proof.'}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-8 border-t border-border mt-8">
                {connectionStatus === 'waiting' && (
                  <div className="flex flex-col items-center animate-pulse">
                    <div className="h-4 w-4 bg-accent rounded-full mb-2"></div>
                    <p className="text-sm font-medium">Waiting for BootNotification...</p>
                    <p className="text-xs text-subtle">Listening for {form.ocppId} on OCPP {form.ocppVersion}. Polling every 3 seconds for up to 120 seconds.</p>
                    {form.authProfile === 'mtls_bootstrap' && bootstrapExpiresAt && (
                      <p className="text-xs text-subtle mt-2">
                        Bootstrap window closes at {new Date(bootstrapExpiresAt).toLocaleTimeString()}.
                        {!bootstrapExpired ? ` ${bootstrapMinutesLeft} minute(s) remaining.` : ' Bootstrap has expired.'}
                      </p>
                    )}
                  </div>
                )}

                {connectionStatus === 'timeout' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M3.055 11a9 9 0 1117.89 0 9 9 0 01-17.89 0z" /></svg>
                    </div>
                    <p className="text-lg font-bold text-amber-600">Connection Timed Out</p>
                    <p className="text-sm text-subtle">
                      {form.authProfile === 'mtls_bootstrap'
                        ? bootstrapExpired
                          ? 'Bootstrap window expired. Re-arm bootstrap or reprovision, then reconnect from an allowed IP/CIDR.'
                          : 'No online signal yet. Verify URL, subprotocol, and that charger source IP matches your bootstrap allowlist.'
                        : 'No online signal received yet. Verify URL, subprotocol, username, and password, then retry.'}
                    </p>
                    <button onClick={retryConnectionCheck} className="btn secondary">Retry Connection Check</button>
                  </div>
                )}

                {connectionStatus === 'connected' && (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-lg font-bold text-green-500">BootNotification Received</p>
                    <p className="text-sm text-subtle">The charger is online and verified by the backend.</p>
                    <div className="mt-4 text-left text-xs text-subtle bg-muted/40 border border-border rounded-lg p-3 w-full max-w-lg">
                      <div>Proof timestamp: {bootProof?.updatedAt ? new Date(bootProof.updatedAt).toLocaleString() : '-'}</div>
                      <div>Vendor: {bootProof?.vendor || '-'}</div>
                      <div>Model: {bootProof?.model || '-'}</div>
                      <div>Firmware: {bootProof?.firmwareVersion || '-'}</div>
                    </div>
                    {form.authProfile === 'mtls_bootstrap' && (
                      <div className="mt-4 text-left text-xs text-subtle bg-muted/40 border border-border rounded-lg p-3 w-full max-w-lg space-y-2">
                        <div className="font-semibold text-foreground">Manual mTLS certificate bind (fallback)</div>
                        <div>Use this when charger cannot run CSR/SignCertificate flow.</div>
                        <input
                          value={certificateFingerprint}
                          onChange={(e) => setCertificateFingerprint(e.target.value)}
                          className="input font-mono"
                          placeholder="Certificate fingerprint (SHA-256 hex)"
                        />
                        <button
                          onClick={handleManualCertificateBind}
                          className="btn secondary"
                          disabled={bindingCertificate}
                        >
                          {bindingCertificate ? 'Binding...' : 'Bind Certificate Fingerprint'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review & Finish</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><div className="text-subtle">Station</div><div className="font-medium">{myStations.find(s => s.id === form.site)?.name || form.site}</div></div>
                <div><div className="text-subtle">Name</div><div className="font-medium">{form.name || '-'}</div></div>
                <div><div className="text-subtle">Type</div><div className="font-medium">{form.type} | {form.power} kW</div></div>
                <div><div className="text-subtle">Manufacturer / Model</div><div className="font-medium">{form.manufacturer || '-'} {form.model || ''}</div></div>
                <div><div className="text-subtle">Serial Number</div><div className="font-medium">{form.serialNumber || '-'}</div></div>
                <div><div className="text-subtle">OCPP ID</div><div className="font-medium font-mono">{form.ocppId}</div></div>
                <div><div className="text-subtle">Protocol</div><div className="font-medium">{form.ocppVersion}</div></div>
                <div><div className="text-subtle">Auth Profile</div><div className="font-medium">{form.authProfile === 'basic' ? 'Basic' : 'mTLS bootstrap'}</div></div>
                <div><div className="text-subtle">Backend Record ID</div><div className="font-medium font-mono">{provisionedChargePointId || '-'}</div></div>
              </div>
              <div>
                <div className="text-sm text-subtle mb-2">Connectors</div>
                <div className="flex flex-wrap gap-2">
                  {form.connectors.map((c, i) => {
                    const spec = CONNECTOR_SPECS.find(cs => cs.key === c.type)
                    return (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">
                        {spec?.displayName || c.type} | {c.maxPower} kW
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
            <button onClick={() => { void handleNext() }} disabled={!canProceed() || provisioning} className={`px-6 py-2 rounded-lg font-medium ${(canProceed() && !provisioning) ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-gray-300 cursor-not-allowed'}`}>
              {step === 1 && provisioning ? 'Provisioning...' : 'Next'}
            </button>
          ) : (
            <button onClick={handleFinish} className="px-6 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover">
              Finish Setup
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AddCharger
