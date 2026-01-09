import { Link } from 'react-router-dom'
import { Card } from '@/ui/components/Card'
import { PATHS } from '@/app/router/paths'

export function QuickNavigationWidget() {
    return (
        <Card className="p-6 flex flex-col gap-4 bg-accent/5 border-accent/10 h-full">
            <h3 className="text-sm font-black uppercase tracking-wider text-text">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
                <NavButton label="Tariffs" path={PATHS.OWNER.TARIFFS} />
                <NavButton label="Payouts" path="/payouts" />
                <NavButton label="Incidents" path={PATHS.INCIDENTS} />
                <NavButton label="Reports" path={PATHS.REPORTS} />
            </div>
        </Card>
    )
}

function NavButton({ label, path }: { label: string, path: string }) {
    return (
        <Link to={path} className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text hover:bg-white/10 transition-all text-center">
            {label}
        </Link>
    )
}
