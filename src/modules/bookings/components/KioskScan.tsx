import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import { Card } from '@/ui/components/Card'
import { useSearchParams } from 'react-router-dom'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & HELPERS
// ═══════════════════════════════════════════════════════════════════════════

type Battery = {
  id: string
  soc: number
  capacityKWh: number
}

type Charge = {
  unit: 'kWh' | 'percent'
  value: number
  amount: number
}

type Receipt = {
  id: string
  stationId: string
  ticketId: string
  mode: 'kWh' | 'percent'
  charge: Charge
  currency: string
  method: string
  settledAt: string
}

function computeCharge({
  mode,
  socIn,
  socOut,
  capacityKWh = 0,
  ratePerKWh = 0,
  ratePerPercent = 0,
}: {
  mode: 'kWh' | 'percent'
  socIn: number
  socOut: number
  capacityKWh: number
  ratePerKWh: number
  ratePerPercent: number
}): Charge {
  if (mode === 'kWh') {
    const usedPct = Math.max(0, socIn - socOut) / 100
    const kWh = +(capacityKWh * usedPct).toFixed(3)
    const amount = +(kWh * ratePerKWh).toFixed(2)
    return { unit: 'kWh', value: kWh, amount }
  }
  const pct = Math.max(0, socIn - socOut)
  const amount = +(pct * ratePerPercent).toFixed(2)
  return { unit: 'percent', value: pct, amount }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Kiosk Scan & Settle - Operator feature
 * For swap stations: scan batteries, compute charge, settle payment
 */
export function KioskScan() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'stations')
  const [searchParams] = useSearchParams()
  const stationIdParam = searchParams.get('stationId') || ''

  const [ticketId, setTicketId] = useState('')
  const [mode, setMode] = useState<'kWh' | 'percent'>('kWh')
  const [ratePerKWh, setRatePerKWh] = useState(0.15)
  const [ratePerPercent, setRatePerPercent] = useState(84)
  const [currency, setCurrency] = useState('USD')
  const [returned, setReturned] = useState<Battery>({ id: '', soc: 0, capacityKWh: 2.4 })
  const [issued, setIssued] = useState<Battery>({ id: '', soc: 0, capacityKWh: 2.4 })
  const [method, setMethod] = useState('MobileMoney')
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [ack, setAck] = useState('')

  const charge = useMemo(
    () =>
      computeCharge({
        mode,
        socIn: returned.soc,
        socOut: issued.soc,
        capacityKWh: returned.capacityKWh,
        ratePerKWh,
        ratePerPercent,
      }),
    [mode, returned, issued, ratePerKWh, ratePerPercent]
  )

  function toast(m: string) {
    setAck(m)
    setTimeout(() => setAck(''), 1400)
  }

  function simulate(which: 'in' | 'out') {
    const rnd = Math.floor(Math.random() * 9000) + 1000
    if (which === 'in') {
      setReturned((r) => ({ ...r, id: `BAT-R-${rnd}`, soc: Math.max(60, r.soc) }))
    } else {
      setIssued((r) => ({ ...r, id: `BAT-I-${rnd}`, soc: Math.max(90, r.soc) }))
    }
  }

  function settle() {
    if (!returned.id || !issued.id) return toast('Scan both batteries')
    let t = ticketId.trim()
    if (!t) {
      t = `WI-${Date.now()}`
      toast(`Walk‑in ${t} created`)
    }
    const now = new Date().toISOString()
    setReceipt({
      id: `RCPT-${Date.now()}`,
      stationId: stationIdParam,
      ticketId: t,
      mode,
      charge,
      currency,
      method,
      settledAt: now,
    })
    toast('Settlement completed')
  }

  if (!perms.view) {
    return (
      <DashboardLayout pageTitle="Kiosk Scan & Settle">
        <Card>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Kiosk — Scan & Settle">
      {ack && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">{ack}</div>}

      {/* Ticket */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm">Ticket (optional)</div>
          {stationIdParam && (
            <div className="text-xs px-2 py-0.5 rounded bg-surface-alt">
              Station: <b>{stationIdParam}</b>
            </div>
          )}
        </div>
        <input
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Enter BK-* or WI-*; blank = auto walk‑in"
          className="w-full rounded border border-border px-3 py-2"
        />
      </Card>

      {/* Billing */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-2">Billing</h3>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'kWh'} onChange={() => setMode('kWh')} />
            kWh
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'percent'} onChange={() => setMode('percent')} />
            Percent
          </label>
          {mode === 'kWh' ? (
            <>
              <label className="inline-flex items-center gap-2">
                Rate/kWh
                <input
                  type="number"
                  step="0.01"
                  value={ratePerKWh}
                  onChange={(e) => setRatePerKWh(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded border px-2 py-1"
                />
              </label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded border px-2 py-1">
                <option>USD</option>
                <option>UGX</option>
              </select>
            </>
          ) : (
            <>
              <label className="inline-flex items-center gap-2">
                Rate/%
                <input
                  type="number"
                  step="1"
                  value={ratePerPercent}
                  onChange={(e) => setRatePerPercent(parseFloat(e.target.value) || 0)}
                  className="w-24 rounded border px-2 py-1"
                />
              </label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded border px-2 py-1">
                <option>UGX</option>
                <option>USD</option>
              </select>
            </>
          )}
        </div>
      </Card>

      {/* Batteries */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="font-semibold mb-2 flex items-center gap-2">Returned</h3>
          <div className="space-y-2">
            <input
              placeholder="Scan/enter ID"
              value={returned.id}
              onChange={(e) => setReturned((r) => ({ ...r, id: e.target.value }))}
              className="rounded border border-border px-3 py-2 w-full"
            />
            <button className="btn secondary" onClick={() => simulate('in')}>
              Simulate scan
            </button>
            <input
              type="number"
              min="0"
              max="100"
              value={returned.soc}
              onChange={(e) => setReturned((r) => ({ ...r, soc: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
              className="rounded border border-border px-3 py-2 w-full"
              placeholder="SoC (%)"
            />
            <input
              type="number"
              step="0.1"
              value={returned.capacityKWh}
              onChange={(e) => setReturned((r) => ({ ...r, capacityKWh: parseFloat(e.target.value) || 0 }))}
              className="rounded border border-border px-3 py-2 w-full"
              placeholder="Capacity (kWh)"
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-2 flex items-center gap-2">Issued</h3>
          <div className="space-y-2">
            <input
              placeholder="Scan/enter ID"
              value={issued.id}
              onChange={(e) => setIssued((r) => ({ ...r, id: e.target.value }))}
              className="rounded border border-border px-3 py-2 w-full"
            />
            <button className="btn secondary" onClick={() => simulate('out')}>
              Simulate scan
            </button>
            <input
              type="number"
              min="0"
              max="100"
              value={issued.soc}
              onChange={(e) => setIssued((r) => ({ ...r, soc: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
              className="rounded border border-border px-3 py-2 w-full"
              placeholder="SoC (%)"
            />
            <input
              type="number"
              step="0.1"
              value={issued.capacityKWh}
              onChange={(e) => setIssued((r) => ({ ...r, capacityKWh: parseFloat(e.target.value) || 0 }))}
              className="rounded border border-border px-3 py-2 w-full"
              placeholder="Capacity (kWh)"
            />
          </div>
        </Card>
      </div>

      {/* Charge */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-2">Charge</h3>
        <div className="text-sm">
          Mode: <b>{charge.unit}</b> • Value: <b>{charge.value}</b> • Amount: <b>
            {currency} {charge.amount}
          </b>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="paym" checked={method === 'MobileMoney'} onChange={() => setMethod('MobileMoney')} />
            Mobile Money
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="paym" checked={method === 'NFC'} onChange={() => setMethod('NFC')} />
            NFC
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="paym" checked={method === 'CashLite'} onChange={() => setMethod('CashLite')} />
            CashLite
          </label>
        </div>
        <div className="mt-4">
          <button className="btn primary" onClick={settle}>
            Settle Payment
          </button>
        </div>
      </Card>

      {/* Receipt */}
      {receipt && (
        <Card>
          <h3 className="font-semibold mb-2">Receipt</h3>
          <div className="text-sm space-y-1">
            <div>
              <span className="text-muted">Receipt ID:</span> {receipt.id}
            </div>
            <div>
              <span className="text-muted">Ticket:</span> {receipt.ticketId}
            </div>
            <div>
              <span className="text-muted">Station:</span> {receipt.stationId || '—'}
            </div>
            <div>
              <span className="text-muted">Charge:</span> {receipt.charge.value} {receipt.charge.unit} = {receipt.currency} {receipt.charge.amount}
            </div>
            <div>
              <span className="text-muted">Method:</span> {receipt.method}
            </div>
            <div>
              <span className="text-muted">Settled:</span> {new Date(receipt.settledAt).toLocaleString()}
            </div>
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}

