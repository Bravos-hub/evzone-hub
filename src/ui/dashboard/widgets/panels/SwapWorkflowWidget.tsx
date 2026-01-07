import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

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
  steps: SwapWorkflowStep[]
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

export function SwapWorkflowWidget({ config }: WidgetProps<SwapWorkflowConfig>) {
  const {
    title = 'Swap session workflow',
    subtitle = 'Scan batteries, assign docks, confirm payment',
    steps = [],
    returnedBattery,
    chargedBattery,
    payment,
  } = config ?? {}

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
