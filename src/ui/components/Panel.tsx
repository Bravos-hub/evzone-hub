type PanelProps = {
  title: string
  subtitle?: string
  items?: string[]
  right?: string
}

export function Panel({ title, subtitle, items, right }: PanelProps) {
  return (
    <div className="panel min-h-[100px]">
      <div className="flex justify-between gap-[10px]">
        <div>
          <div className="text-text font-semibold">{title}</div>
          {subtitle ? <div className="text-xs text-muted">{subtitle}</div> : null}
        </div>
        {right ? <div className="text-xs text-muted">{right}</div> : null}
      </div>

      {items?.length ? (
        <ul className="mt-3 grid gap-1 text-xs text-muted">
          {items.slice(0, 4).map((it) => (
            <li key={it} className="list-disc ml-4">{it}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

