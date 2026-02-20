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
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={filters.q}
                        onChange={(e) => actions.setQ(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm"
                        placeholder="Search listings by name or city..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => actions.setViewMode('GRID')}
                            className={`p-1.5 rounded-md transition-colors ${filters.viewMode === 'GRID' ? 'bg-white shadow-sm text-accent' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            title="Grid View"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => actions.setViewMode('LIST')}
                            className={`p-1.5 rounded-md transition-colors ${filters.viewMode === 'LIST' ? 'bg-white shadow-sm text-accent' : 'text-gray-500 hover:text-gray-700'
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
                <select
                    value={filters.kind}
                    onChange={(e) => actions.setKind(e.target.value as any)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
                >
                    {KIND_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.region}
                    onChange={(e) => actions.setRegion(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
                >
                    {listingRegionOptions.map((option) => (
                        <option key={option} value={option}>
                            {option === 'ALL' ? 'All Listing Regions' : option}
                        </option>
                    ))}
                </select>

                {/* Action Button to Clear Filters? */}
            </div>

            {/* Provider Specific Filters - Only show if Providers are relevant/selected? 
          Or always show? Original Marketplace.tsx showed them in a separate card. 
          Let's make them collapsible or contextual. 
          For now, keep visible but grouped.
      */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider Filters</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                        value={filters.providerQuery}
                        onChange={(e) => actions.setProviderQuery(e.target.value)}
                        placeholder="Search provider..."
                        className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    />
                    <select
                        value={filters.providerRegion}
                        onChange={(e) => actions.setProviderRegion(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
                    >
                        {providerRegionOptions.map((option) => (
                            <option key={option} value={option}>
                                {option === 'ALL' ? 'All Provider Regions' : option}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.providerStatus}
                        onChange={(e) => actions.setProviderStatus(e.target.value as any)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
                    >
                        {PROVIDER_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option === 'All' ? 'All Provider Statuses' : humanizeStatus(option)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.relationshipStatus}
                        onChange={(e) => actions.setRelationshipStatus(e.target.value as any)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md"
                    >
                        {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option === 'All' ? 'All Relationship Statuses' : humanizeStatus(option)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}
