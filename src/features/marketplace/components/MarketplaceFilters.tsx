import type { MarketplaceFilterActions, MarketplaceFilters as FilterState } from '../hooks/useMarketplaceFilters'
import { humanizeProviderStatus } from '@/modules/integrations/providerStatus'

const PROVIDER_STATUS_OPTIONS = [
    'All', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'UNKNOWN'
] as const

const RELATIONSHIP_STATUS_OPTIONS = [
    'All', 'NONE', 'REQUESTED', 'PROVIDER_ACCEPTED', 'DOCS_PENDING', 'ADMIN_APPROVED', 'ACTIVE', 'SUSPENDED', 'TERMINATED', 'UNKNOWN'
] as const

const KIND_FILTER_OPTIONS = [
    { value: 'All', label: 'All' },
    { value: 'Sites', label: 'Sites' },
    { value: 'Operators', label: 'Operators' },
    { value: 'Providers', label: 'Swap Providers' },
    { value: 'Technicians', label: 'Technicians' },
] as const

type Props = {
    filters: FilterState
    actions: MarketplaceFilterActions
    listingRegionOptions: string[]
    providerRegionOptions: string[]
}

const humanizeStatus = (value: string) => (value === 'N/A' ? 'N/A' : humanizeProviderStatus(value))

export function MarketplaceFilters({
    filters,
    actions,
    listingRegionOptions,
    providerRegionOptions
}: Props) {

    return (
        <div className="space-y-4">
            {/* Primary Search & Controls Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={filters.q}
                        onChange={(e) => actions.setQ(e.target.value)}
                        className="input pl-10"
                        placeholder="Search listings by name or city..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-panel-2 p-1 rounded-lg border border-border-light">
                        <button
                            onClick={() => actions.setViewMode('GRID')}
                            className={`p-1.5 rounded-md transition-colors ${filters.viewMode === 'GRID' ? 'bg-panel shadow-sm text-accent' : 'text-muted hover:text-text'
                                }`}
                            title="Grid View"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => actions.setViewMode('LIST')}
                            className={`p-1.5 rounded-md transition-colors ${filters.viewMode === 'LIST' ? 'bg-panel shadow-sm text-accent' : 'text-muted hover:text-text'
                                }`}
                            title="List View"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Filters Grid */}
            <div className="grid md:grid-cols-4 gap-3">
                <div className="relative">
                    <select
                        value={filters.kind}
                        onChange={(e) => actions.setKind(e.target.value as any)}
                        className="select w-full appearance-none"
                    >
                        {KIND_FILTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                <div className="relative">
                    <select
                        value={filters.region}
                        onChange={(e) => actions.setRegion(e.target.value)}
                        className="select w-full appearance-none"
                    >
                        {listingRegionOptions.map((option) => (
                            <option key={option} value={option}>
                                {option === 'ALL' ? 'All Listing Regions' : option}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* Provider Specific Filters - Only show when relevant */}
            {(filters.kind === 'All' || filters.kind === 'Providers') && (
                <div className="pt-2 border-t border-border-light">
                    <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted hover:text-text uppercase tracking-wider select-none w-fit mb-3 transition-colors">
                            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span>Provider Filters</span>
                        </summary>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <input
                                value={filters.providerQuery}
                                onChange={(e) => actions.setProviderQuery(e.target.value)}
                                placeholder="Search provider..."
                                className="input"
                            />
                            <div className="relative">
                                <select
                                    value={filters.providerRegion}
                                    onChange={(e) => actions.setProviderRegion(e.target.value)}
                                    className="select w-full appearance-none"
                                >
                                    {providerRegionOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option === 'ALL' ? 'All Provider Regions' : option}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="relative">
                                <select
                                    value={filters.providerStatus}
                                    onChange={(e) => actions.setProviderStatus(e.target.value as any)}
                                    className="select w-full appearance-none"
                                >
                                    {PROVIDER_STATUS_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option === 'All' ? 'All Provider Statuses' : humanizeStatus(option)}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="relative">
                                <select
                                    value={filters.relationshipStatus}
                                    onChange={(e) => actions.setRelationshipStatus(e.target.value as any)}
                                    className="select w-full appearance-none"
                                >
                                    {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option === 'All' ? 'All Relationship Statuses' : humanizeStatus(option)}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    )
}
