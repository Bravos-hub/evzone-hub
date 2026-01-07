import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type PlaceholderConfig = {
  title: string
  subtitle?: string
  items?: string[]
}

export function PlaceholderWidget({ config }: WidgetProps<PlaceholderConfig>) {
  const { title = 'Placeholder', subtitle, items } = config ?? {}

  return (
    <Card>
      <div className="text-sm font-semibold text-text">{title}</div>
      {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      {items && items.length > 0 && (
        <ul className="mt-3 grid gap-1 text-xs text-muted">
          {items.slice(0, 4).map((it, i) => (
            <li key={i} className="list-disc ml-4">{it}</li>
          ))}
        </ul>
      )}
    </Card>
  )
}

