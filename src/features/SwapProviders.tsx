import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Card } from '@/ui/components/Card'
import { useProviders } from '@/modules/integrations/useProviders'
import { getErrorMessage } from '@/core/api/errors'
import { useAuthStore } from '@/core/auth/authStore'
import { hasPermission } from '@/constants/permissions'

export function SwapProviders() {
    const { user } = useAuthStore()
    const canManage = hasPermission(user?.role, 'stations', 'manage')

    const [q, setQ] = useState('')
    const [regionFilter, setRegionFilter] = useState('All')
    const [statusFilter, setStatusFilter] = useState('All')

    const { data: providers, isLoading, error } = useProviders()

    const filteredProviders = useMemo(() => {
        if (!providers) return []
        return providers
            .filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.region.toLowerCase().includes(q.toLowerCase()))
            .filter(p => regionFilter === 'All' || p.region.includes(regionFilter))
            .filter(p => statusFilter === 'All' || p.status === statusFilter)
    }, [providers, q, regionFilter, statusFilter])

    const regions = useMemo(() => {
        if (!providers) return ['All']
        const unique = new Set(providers.map(p => p.region.split(' (')[0])) // Simplified region name
        return ['All', ...Array.from(unique)]
    }, [providers])

    if (error) {
        return (
            <DashboardLayout pageTitle="Swapping Providers">
                <div className="p-8 text-center bg-red-500/5 rounded-2xl border border-red-500/10">
                    <p className="text-red-500 font-bold">Failed to load providers</p>
                    <p className="text-text-secondary text-sm mt-1">{getErrorMessage(error)}</p>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout pageTitle="Battery Swapping Providers">
            <div className="flex flex-col gap-6 pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-text tracking-tight">Global Network</h2>
                        <p className="text-text-secondary text-sm">Directory of supported battery swapping standards and partners.</p>
                    </div>
                    {canManage && (
                        <button className="px-6 py-2.5 bg-accent text-white font-black text-sm rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20">
                            Register New Provider
                        </button>
                    )}
                </div>

                {/* Filters */}
                <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 border-white/5 shadow-none">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search providers or regions..."
                            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                            value={q}
                            onChange={e => setQ(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
                        value={regionFilter}
                        onChange={e => setRegionFilter(e.target.value)}
                    >
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select
                        className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </Card>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="h-[280px] animate-pulse bg-white/5 border-white/5">
                                <div className="w-full h-full" />
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProviders.map(provider => (
                            <ProviderCard key={provider.id} provider={provider} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

function ProviderCard({ provider }: { provider: any }) {
    const isGogoro = provider.name.toLowerCase().includes('gogoro')
    const isNio = provider.name.toLowerCase().includes('nio')
    const isSpiro = provider.name.toLowerCase().includes('spiro')

    const themeColor = isGogoro ? 'bg-green-500' : isNio ? 'bg-blue-500' : isSpiro ? 'bg-purple-500' : 'bg-accent'

    return (
        <Card className="group overflow-hidden border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all hover:translate-y-[-4px]">
            <div className={`h-2 ${themeColor}`} />
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${themeColor}/10 flex items-center justify-center text-xl font-black ${themeColor.replace('bg-', 'text-')}`}>
                            {provider.name[0]}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-text group-hover:text-accent transition-colors">{provider.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{provider.region}</p>
                        </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${provider.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                        provider.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                        {provider.status}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-surface border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">Standard</p>
                        <p className="text-xs font-bold text-text truncate">{provider.standard}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1">Stations</p>
                        <p className="text-xs font-bold text-text">{provider.stationCount.toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Supported Packs</p>
                    <div className="flex flex-wrap gap-1.5">
                        {provider.batteriesSupported.map((battery: string) => (
                            <span key={battery} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-text-secondary">
                                {battery}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-text-secondary italic">Partner since {new Date(provider.partnerSince).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
                    <button className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">
                        Manage Partner
                    </button>
                </div>
            </div>
        </Card>
    )
}
