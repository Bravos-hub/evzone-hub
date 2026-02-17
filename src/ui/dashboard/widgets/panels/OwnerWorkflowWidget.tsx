import { Link } from 'react-router-dom'
import { PATHS } from '@/app/router/paths'

export function OwnerWorkflowWidget() {
    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Station Owner Workflow
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <WorkflowCard
                    step="1"
                    title="Add My Sites"
                    description="Register your land or locations"
                    path={PATHS.SITE_OWNER.ADD_SITE}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    color="blue"
                />
                <WorkflowCard
                    step="2"
                    title="Rent Sites"
                    description="Apply for leases on prime hubs"
                    path={PATHS.MARKETPLACE}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                    color="orange"
                />
                <WorkflowCard
                    step="3"
                    title="Register Station"
                    description="Add a swap unit to your site"
                    path={PATHS.OWNER.ADD_STATION_ENTRY}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    color="purple"
                />
                <WorkflowCard
                    step="4"
                    title="Configure Bays"
                    description="Set up battery docks & inventory"
                    path={PATHS.STATIONS.SWAP_STATIONS}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    color="green"
                />
            </div>
        </div>
    )
}

function WorkflowCard({ step, title, description, path, icon, color }: { step: string, title: string, description: string, path: string, icon: React.ReactNode, color: string }) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:border-blue-500/40",
        orange: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:border-orange-500/40",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:border-purple-500/40",
        green: "bg-green-500/10 text-green-500 border-green-500/20 hover:border-green-500/40",
    }

    return (
        <Link
            to={path}
            className={`p-4 rounded-2xl border transition-all group relative overflow-hidden flex flex-col gap-3 bg-white/5 ${colorClasses[color]}`}
        >
            <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-white/10 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <span className="text-2xl font-black opacity-10 select-none">{step}</span>
            </div>
            <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-text leading-tight">{title}</h4>
                <p className="text-[10px] text-text-secondary leading-tight mt-1">{description}</p>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 w-0 group-hover:w-full ${color === 'blue' ? 'bg-blue-500' : color === 'orange' ? 'bg-orange-500' : color === 'purple' ? 'bg-purple-500' : 'bg-green-500'
                }`} />
        </Link>
    )
}
