import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { MarketplaceEntityKind } from '../types'
import type { NormalizedProviderStatus, NormalizedRelationshipStatus } from '@/modules/integrations/providerStatus'

export type ViewMode = 'LIST' | 'GRID'

export type MarketplaceFilters = {
    kind: MarketplaceEntityKind | 'All'
    region: string
    q: string
    providerQuery: string
    providerRegion: string
    providerStatus: NormalizedProviderStatus | 'All'
    relationshipStatus: NormalizedRelationshipStatus | 'All'
    viewMode: ViewMode
}

export type MarketplaceFilterActions = {
    setKind: (kind: MarketplaceEntityKind | 'All') => void
    setRegion: (region: string) => void
    setQ: (q: string) => void
    setProviderQuery: (q: string) => void
    setProviderRegion: (region: string) => void
    setProviderStatus: (status: NormalizedProviderStatus | 'All') => void
    setRelationshipStatus: (status: NormalizedRelationshipStatus | 'All') => void
    setViewMode: (mode: ViewMode) => void
    resetFilters: () => void
}

function parseKindParam(value: string | null): MarketplaceEntityKind | 'All' {
    const normalized = value?.trim().toLowerCase()
    if (normalized === 'all') return 'All'
    if (normalized === 'sites') return 'Sites'
    if (normalized === 'operators') return 'Operators'
    if (normalized === 'technicians') return 'Technicians'
    if (normalized === 'providers' || normalized === 'swap-providers' || normalized === 'swap providers') return 'Providers'
    return 'All'
}

export function useMarketplaceFilters() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Main Filters
    const [kind, setKindState] = useState<MarketplaceEntityKind | 'All'>(() => parseKindParam(searchParams.get('kind')))
    const [region, setRegion] = useState('ALL')
    const [q, setQ] = useState('')

    // Provider Specific Filters
    const [providerQuery, setProviderQuery] = useState('')
    const [providerRegion, setProviderRegion] = useState('ALL')
    const [providerStatus, setProviderStatus] = useState<NormalizedProviderStatus | 'All'>('All')
    const [relationshipStatus, setRelationshipStatus] = useState<NormalizedRelationshipStatus | 'All'>('All')

    // UI State
    const [viewMode, setViewMode] = useState<ViewMode>('GRID')

    // Sync Kind with URL
    useEffect(() => {
        const param = searchParams.get('kind')
        setKindState(parseKindParam(param))
    }, [searchParams])

    const setKind = useCallback((newKind: MarketplaceEntityKind | 'All') => {
        setKindState(newKind)
        setSearchParams(prev => {
            if (newKind === 'All') {
                prev.delete('kind')
            } else {
                prev.set('kind', newKind)
            }
            return prev
        })
    }, [setSearchParams])

    const resetFilters = useCallback(() => {
        setRegion('ALL')
        setQ('')
        setProviderQuery('')
        setProviderRegion('ALL')
        setProviderStatus('All')
        setRelationshipStatus('All')
    }, [])

    return {
        filters: {
            kind,
            region,
            q,
            providerQuery,
            providerRegion,
            providerStatus,
            relationshipStatus,
            viewMode
        },
        actions: {
            setKind,
            setRegion,
            setQ,
            setProviderQuery,
            setProviderRegion,
            setProviderStatus,
            setRelationshipStatus,
            setViewMode,
            resetFilters
        }
    }
}
