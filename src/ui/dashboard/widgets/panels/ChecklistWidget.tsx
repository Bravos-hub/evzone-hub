import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type ChecklistItem = {
    id: string
    label: string
    completed: boolean
    critical: boolean
}

export type ChecklistConfig = {
    title?: string
    subtitle?: string
    items: ChecklistItem[]
}

export function ChecklistWidget({ config }: WidgetProps<ChecklistConfig>) {
    const { title = 'Daily Operational Checklist', subtitle = 'Required safety & maintenance tasks', items = [] } = config ?? {}

    const completedCount = items.filter(i => i.completed).length
    const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

    return (
        <Card className="p-0">
            <div className="p-4 border-b border-border-light">
                <div className="flex items-center justify-between mb-2">
                    <div className="card-title">{title}</div>
                    <div className="text-xs font-bold text-accent">{completedCount}/{items.length}</div>
                </div>
                <div className="h-1.5 w-full bg-panel rounded-full overflow-hidden border border-border-light/50">
                    <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="p-4 flex flex-col gap-2">
                {items.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-panel/30 border border-border-light hover:border-accent/40 transition-all cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => { }} // Read-only for demo
                                className="peer h-5 w-5 rounded-md border-2 border-border-light bg-transparent checked:bg-accent checked:border-accent transition-all cursor-pointer appearance-none"
                            />
                            <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${item.completed ? 'text-muted line-through' : 'text-text'}`}>
                                {item.label}
                            </div>
                            {item.critical && !item.completed && (
                                <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Critical Safety Task</div>
                            )}
                        </div>
                    </label>
                ))}

                {items.length === 0 && (
                    <div className="py-8 text-center text-muted text-sm italic">
                        Checklist is empty for today.
                    </div>
                )}
            </div>

            <div className="px-4 py-3 bg-panel/20 border-t border-border-light">
                <button className="w-full py-2 rounded-lg bg-accent text-white text-xs font-bold shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all">
                    Submit Checklist Report
                </button>
            </div>
        </Card>
    )
}
