import { StationMapData } from './StationMapCanvas'

interface StationListPanelProps {
    stations: StationMapData[]
    selectedStationId?: string | null
    onSelect: (id: string) => void
    isLoading?: boolean
}

export function StationListPanel({
    stations,
    selectedStationId,
    onSelect,
    isLoading
}: StationListPanelProps) {
    return (
        <div className="grow overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-3 border border-border-light rounded-xl animate-pulse bg-white/5">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                    </div>
                ))
            ) : stations.length === 0 ? (
                <div className="text-center text-muted text-sm py-8 bg-white/5 rounded-xl border border-dashed border-border-light">
                    No stations found matching filters
                </div>
            ) : (
                stations.map(s => (
                    <div
                        key={s.id}
                        onClick={() => onSelect(s.id)}
                        className={`group p-3 border rounded-xl cursor-pointer transition-all duration-200 ${selectedStationId === s.id
                                ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(3,205,140,0.1)]'
                                : 'border-border-light bg-white/5 hover:border-accent/40 hover:bg-white/10'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-sm font-bold truncate transition-colors ${selectedStationId === s.id ? 'text-accent' : 'text-text'
                                }`}>
                                {s.name}
                            </span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${s.status === 'ACTIVE' ? 'bg-ok/20 text-ok' : 'bg-danger/20 text-danger'
                                }`}>
                                {s.status}
                            </span>
                        </div>
                        <div className="text-[11px] text-muted line-clamp-1 mb-2 group-hover:text-text/70 transition-colors">
                            {s.address}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-muted/60 bg-white/10 px-1.5 py-0.5 rounded">
                                ID: {s.id.split('-')[0]}...
                            </span>
                            <span className="text-[10px] font-bold text-accent group-hover:underline">
                                View Details →
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
