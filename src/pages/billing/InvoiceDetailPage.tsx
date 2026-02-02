import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { billingService } from '@/modules/finance/billing/billingService'
import { useQuery } from '@tanstack/react-query'
import { PATHS } from '@/app/router/paths'
import { getErrorMessage } from '@/core/api/errors'
import { TableSkeleton, TextSkeleton } from '@/ui/components/SkeletonCards'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: () => billingService.getInvoice(id || ''),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Invoice Details">
        <div className="space-y-4">
          <div className="card">
            <TextSkeleton lines={3} />
          </div>
          <div className="card">
            <TableSkeleton rows={4} cols={4} />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !invoice) {
    return (
      <DashboardLayout pageTitle="Invoice Details">
        <div className="card bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm">
            {error ? getErrorMessage(error) : 'Invoice not found'}
          </div>
          <Link to={PATHS.BILLING} className="btn secondary mt-4">
            Back to Billing
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Invoice Details">
      <div className="mb-6">
        <Link to={PATHS.BILLING} className="text-sm text-subtle hover:text-text mb-2 inline-block">
          ← Back to Billing
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoice {invoice.id}</h1>
            <p className="text-muted">{invoice.description}</p>
          </div>
          <span className={`pill ${
            invoice.status === 'Paid' ? 'approved' :
            invoice.status === 'Pending' ? 'pending' :
            invoice.status === 'Overdue' ? 'rejected' :
            'sendback'
          }`}>
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Invoice Display */}
      <div className="card max-w-4xl mx-auto">
        <div className="border-b border-border-light pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">EVzone Platform</h2>
              <p className="text-muted text-sm">Billing & Invoicing</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted mb-1">Invoice Number</div>
              <div className="font-bold text-lg">{invoice.id}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-xs text-muted mb-1">Bill To</div>
            <div className="font-semibold">{invoice.org}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted mb-1">Invoice Date</div>
            <div className="font-semibold">{invoice.issuedAt}</div>
            <div className="text-xs text-muted mt-2 mb-1">Due Date</div>
            <div className="font-semibold">{invoice.dueAt}</div>
            {invoice.paidAt && (
              <>
                <div className="text-xs text-muted mt-2 mb-1">Paid Date</div>
                <div className="font-semibold">{invoice.paidAt}</div>
              </>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-3 text-sm font-semibold">Description</th>
                <th className="text-right py-3 text-sm font-semibold">Quantity</th>
                <th className="text-right py-3 text-sm font-semibold">Unit Price</th>
                <th className="text-right py-3 text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-border-light">
                    <td className="py-3">{item.description}</td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">${item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-3 font-semibold">${item.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-3 text-muted text-center">
                    {invoice.description}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold">${invoice.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Tax</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="border-t border-border-light pt-2 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-xl">${invoice.amount.toFixed(2)} {invoice.currency}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-border-light flex gap-2 justify-end">
          <button className="btn secondary" onClick={() => window.print()}>
            Print
          </button>
          <button className="btn secondary" onClick={() => alert('Download PDF (demo)')}>
            Download PDF
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
