interface StationFiltersPanelProps {
    query: string
    setQuery: (q: string) => void
    status: string
    setStatus: (s: string) => void
    type: string
    setType: (t: string) => void
    showCoverage: boolean
    setShowCoverage: (v: boolean) => void
    isLoading?: boolean
}

export function StationFiltersPanel({
    query,
    setQuery,
    status,
    setStatus,
    type,
    setType,
    showCoverage,
    setShowCoverage,
    isLoading
}: StationFiltersPanelProps) {
    return (
        <div className="shrink-0 space-y-4">
            <div className="relative group">
                <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name, ID, or address..."
                    className="input w-full pl-10 h-10 bg-white/5 border-border-light group-hover:border-accent/30 focus:border-accent transition-all"
                    disabled={isLoading}
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-hover:text-accent/50 transition-colors">
                    🔍
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="select h-9 text-xs bg-white/5 border-border-light hover:border-accent/30 transition-all font-medium"
                    disabled={isLoading}
                >
                    <option value="All">All Status</option>
                    <option value="ACTIVE">Foundational (Active)</option>
                    <option value="INACTIVE">Offline</option>
                    <option value="MAINTENANCE">Maintenance</option>
                </select>

                <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="select h-9 text-xs bg-white/5 border-border-light hover:border-accent/30 transition-all font-medium"
                    disabled={isLoading}
                >
                    <option value="All">All Types</option>
                    <option value="CHARGING">Charging Only</option>
                    <option value="SWAP">Swapping Only</option>
                    <option value="BOTH">Hybrid Only</option>
                </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-border-light/50 hover:bg-white/10 transition-all">
                <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-accent tracking-widest">Network Coverage</span>
                    <span className="text-[10px] text-muted font-medium mt-0.5">Visualize station density via H3</span>
                </div>
                <button
                    onClick={() => setShowCoverage(!showCoverage)}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 outline-none ${showCoverage ? 'bg-accent' : 'bg-white/20'
                        }`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showCoverage ? 'right-1' : 'left-1'
                        }`} />
                </button>
            </div>
        </div>
    )
}
