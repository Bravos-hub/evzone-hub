import type { WidgetProps } from '../../types'
import { Card } from '@/ui/components/Card'

export type StaffMember = {
    id: string
    name: string
    role: string
    status: 'active' | 'break' | 'offline'
    assignment: string
    avatar?: string
}

export type ShiftBoardConfig = {
    title?: string
    subtitle?: string
    staff: StaffMember[]
}

export function ShiftBoardWidget({ config }: WidgetProps<ShiftBoardConfig>) {
    const { title = 'Shift Board', subtitle = 'Staff currently on duty', staff = [] } = config ?? {}

    const getStatusColor = (status: StaffMember['status']) => {
        switch (status) {
            case 'active': return 'bg-emerald-500'
            case 'break': return 'bg-amber-500'
            case 'offline': return 'bg-slate-500'
            default: return 'bg-slate-500'
        }
    }

    return (
        <Card className="p-0">
            <div className="p-4 border-b border-border-light">
                <div className="card-title">{title}</div>
                {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
            </div>
            <div className="p-4 grid gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 gap-3">
                    {staff.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-panel/40 border border-border-light/50 hover:border-accent/30 transition-all group">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-accent-light flex items-center justify-center font-bold text-accent text-sm group-hover:bg-accent group-hover:text-white transition-colors">
                                    {s.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-panel ${getStatusColor(s.status)} shadow-sm`} />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold truncate text-text">{s.name}</div>
                                <div className="text-[11px] text-muted truncate">{s.role} • {s.assignment}</div>
                            </div>
                        </div>
                    ))}
                    {staff.length === 0 && (
                        <div className="col-span-full py-6 text-center text-muted text-sm italic">
                            No staff members currently on duty.
                        </div>
                    )}
                </div>
            </div>
            <div className="px-4 py-3 bg-panel/20 border-t border-border-light">
                <button className="w-full py-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
                    Manage Shift Schedule →
                </button>
            </div>
        </Card>
    )
}
