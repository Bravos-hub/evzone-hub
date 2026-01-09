import { Link } from 'react-router-dom'
import { Card } from '@/ui/components/Card'
import { PATHS } from '@/app/router/paths'
import { ROLE_LABELS } from '@/constants/roles'
import type { Role } from '@/core/auth/types'

export function TeamActivityWidget() {
    return (
        <Card className="p-6 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-text">Team Activity</h3>
                <Link to={PATHS.TEAM} className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline">
                    Manage Team
                </Link>
            </div>
            <div className="flex flex-col gap-3">
                {[
                    { name: 'Grace Manager', role: 'MANAGER' as Role },
                    { name: 'Allan Tech', role: 'TECHNICIAN_ORG' as Role },
                    { name: 'Cathy Cashier', role: 'CASHIER' as Role },
                ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent uppercase">
                                {m.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text leading-none">{m.name}</p>
                                <p className="text-[10px] text-text-secondary">{ROLE_LABELS[m.role]}</p>
                            </div>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    </div>
                ))}
            </div>
            <Link to={PATHS.TEAM} className="w-full py-2.5 mt-auto rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-wider text-text-secondary hover:bg-white/10 transition-all text-center">
                + Invite Staff
            </Link>
        </Card>
    )
}
