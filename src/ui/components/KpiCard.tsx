import { Card } from './Card'

export function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <p className="card-title mb-2.5">{title}</p>
      <p className="kpi-value">{value}</p>
    </Card>
  )
}

