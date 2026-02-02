import { useMemo } from 'react'
import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'
import { useRealtimeStats } from '@/modules/analytics/hooks/useAnalytics'

export type SwapWorkflowStep = {
  id: string
  label: string
  detail?: string
  status: 'done' | 'active' | 'pending'
}

export type SwapBattery = {
  id: string
  soc: number
  energyKwh: number
  dock?: string
}

export type SwapPayment = {
  amount: number
  currency: string
  method: string
  status: 'pending' | 'paid'
}

export type SwapWorkflowConfig = {
  title?: string
  subtitle?: string
  steps?: SwapWorkflowStep[]
  returnedBattery?: SwapBattery
  chargedBattery?: SwapBattery
  payment?: SwapPayment
}

function stepIndicatorClass(status: SwapWorkflowStep['status']) {
  switch (status) {
    case 'done':
      return 'border-ok/50 bg-ok/10 text-ok'
    case 'active':
      return 'border-warn/50 bg-warn/10 text-warn'
    case 'pending':
    default:
      return 'border-border-light bg-panel text-muted'
  }
}

function stepLabelClass(status: SwapWorkflowStep['status']) {
  switch (status) {
    case 'done':
      return 'text-ok'
    case 'active':
      return 'text-warn'
    case 'pending':
    default:
      return 'text-muted'
  }
}

function formatAmount(amount: number, currency: string) {
  const hasDecimals = currency !== 'UGX'
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })
  return `${currency} ${formatted}`
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function normalizeBattery(raw: any): SwapBattery | undefined {
  if (!raw) return undefined
  const id = raw.id ?? raw.batteryId ?? raw.code
  if (!id) return undefined
  return {
    id: String(id),
    soc: toNumber(raw.soc ?? raw.stateOfCharge),
    energyKwh: toNumber(raw.energyKwh ?? raw.energy ?? raw.kwh),
    dock: raw.dock ?? raw.bay ?? raw.slot,
  }
}

function normalizePayment(raw: any): SwapPayment | undefined {
  if (!raw) return undefined
  const amount = toNumber(raw.amount ?? raw.total ?? raw.cost)
  const currency = raw.currency ?? 'USD'
  const method = raw.method ?? raw.channel ?? 'Unknown'
  const statusRaw = String(raw.status ?? '').toLowerCase()
  const status: SwapPayment['status'] = statusRaw.includes('paid') || statusRaw.includes('success') ? 'paid' : 'pending'
  return { amount, currency, method, status }
}

function buildSteps(payload: any): SwapWorkflowStep[] {
  const steps: Array<{ id: string; label: string; detail?: string; done: boolean }> = []

  const returned = normalizeBattery(payload?.returnedBattery ?? payload?.batteryIn ?? payload?.batteryReturned)
  const charged = normalizeBattery(payload?.chargedBattery ?? payload?.batteryOut ?? payload?.batteryCharged)
  const payment = normalizePayment(payload?.payment ?? payload?.charge ?? payload)

  steps.push({
    id: 'swap-return',
    label: 'Scan returned battery',
    detail: returned ? returned.id : 'Waiting for scan',
    done: Boolean(returned),
  })

  if (returned) {
    steps.push({
      id: 'swap-health',
      label: 'Check power and energy',
      detail: `SOC ${returned.soc}% - ${returned.energyKwh} kWh`,
      done: true,
    })
  }

  steps.push({
    id: 'swap-return-dock',
    label: 'Assign return dock',
    detail: returned?.dock ? `Dock ${returned.dock}` : 'Pending assignment',
    done: Boolean(returned?.dock),
  })

  steps.push({
    id: 'swap-charge-dock',
    label: 'Assign charged dock',
    detail: charged?.dock ? `Dock ${charged.dock}` : 'Pending assignment',
    done: Boolean(charged?.dock),
  })

  steps.push({
    id: 'swap-charge',
    label: 'Scan charged battery',
    detail: charged ? charged.id : 'Waiting for scan',
    done: Boolean(charged),
  })

  steps.push({
    id: 'swap-payment',
    label: 'Confirm payment',
    detail: payment ? formatAmount(payment.amount, payment.currency) : 'Pending payment',
    done: Boolean(payment && payment.status === 'paid'),
  })

  let activated = false
  return steps.map((step) => {
    if (step.done) return { id: step.id, label: step.label, detail: step.detail, status: 'done' as const }
    if (!activated) {
      activated = true
      return { id: step.id, label: step.label, detail: step.detail, status: 'active' as const }
    }
    return { id: step.id, label: step.label, detail: step.detail, status: 'pending' as const }
  })
}

export function SwapWorkflowWidget({ config }: WidgetProps<SwapWorkflowConfig>) {
  const { data: realtime } = useRealtimeStats() as any

  const derived = useMemo(() => {
    const payload = realtime?.swapWorkflow ?? realtime?.swapSession ?? realtime?.swap ?? realtime?.activeSwap ?? null
    if (!payload) return { steps: [], returnedBattery: undefined, chargedBattery: undefined, payment: undefined }

    return {
      steps: buildSteps(payload),
      returnedBattery: normalizeBattery(payload?.returnedBattery ?? payload?.batteryIn ?? payload?.batteryReturned),
      chargedBattery: normalizeBattery(payload?.chargedBattery ?? payload?.batteryOut ?? payload?.batteryCharged),
      payment: normalizePayment(payload?.payment ?? payload?.charge ?? payload),
    }
  }, [realtime])

  const title = config?.title ?? 'Swap session workflow'
  const subtitle = config?.subtitle ?? 'Scan batteries, assign docks, confirm payment'
  const steps = config?.steps ?? derived.steps
  const returnedBattery = config?.returnedBattery ?? derived.returnedBattery
  const chargedBattery = config?.chargedBattery ?? derived.chargedBattery
  const payment = config?.payment ?? derived.payment

  return (
    <Card className="p-0">
      <div className="p-4 border-b border-border-light">
        <div className="card-title">{title}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>

      <div className="p-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-3">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-start gap-3 p-3 rounded-xl border border-border-light bg-panel/30">
              <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold ${stepIndicatorClass(step.status)}`}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-text">{step.label}</div>
                {step.detail && <div className="text-xs text-muted">{step.detail}</div>}
              </div>
              <div className={`text-[10px] uppercase font-semibold ${stepLabelClass(step.status)}`}>{step.status}</div>
            </div>
          ))}
          {steps.length === 0 && (
            <div className="py-8 text-center text-muted text-sm italic">
              No active swap steps.
            </div>
          )}
        </div>

        <div className="grid gap-3">
          {returnedBattery && (
            <div className="panel">
              <div className="text-[11px] uppercase text-muted">Returned battery</div>
              <div className="text-lg font-semibold text-text">{returnedBattery.id}</div>
              <div className="text-xs text-muted">
                SOC {returnedBattery.soc}% | Energy {returnedBattery.energyKwh} kWh{returnedBattery.dock ? ` | Dock ${returnedBattery.dock}` : ''}
              </div>
            </div>
          )}

          {chargedBattery && (
            <div className="panel">
              <div className="text-[11px] uppercase text-muted">Charged battery</div>
              <div className="text-lg font-semibold text-text">{chargedBattery.id}</div>
              <div className="text-xs text-muted">
                SOC {chargedBattery.soc}% | Energy {chargedBattery.energyKwh} kWh{chargedBattery.dock ? ` | Dock ${chargedBattery.dock}` : ''}
              </div>
            </div>
          )}

          {payment && (
            <div className="panel">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase text-muted">Amount due</div>
                  <div className="text-xl font-semibold text-text">{formatAmount(payment.amount, payment.currency)}</div>
                  <div className="text-xs text-muted">Method: {payment.method}</div>
                </div>
                <span className={`pill ${payment.status === 'paid' ? 'approved' : 'pending'}`}>
                  {payment.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn">Confirm payment</button>
                <button className="btn secondary">Print receipt</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
