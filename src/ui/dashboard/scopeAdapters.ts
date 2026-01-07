import type { Scope } from '@/core/auth/types'
import type { ChoroplethDatum } from '@/ui/components/WorldChoroplethMap'
import { isInScope, regionInScope } from '@/core/scope/utils'

type AdaptResult = { config: Record<string, unknown> | undefined; visible: boolean }

/**
 * Adapt widget config based on scope.
 * Returns visible=false to hide the widget when no scoped data is available.
 */
export function adaptWidgetConfig(
  widgetId: string,
  config: Record<string, unknown> | undefined,
  scope: Scope
): AdaptResult {
  // No scope constraints applied
  if (!config) return { config, visible: true }

  switch (widgetId) {
    case 'map-world': {
      const data = (config as any).data as ChoroplethDatum[] | undefined
      if (!data) return { config, visible: true }
      const filtered = data.filter((d) => regionInScope(scope, d.id))
      return { config: { ...config, data: filtered }, visible: filtered.length > 0 }
    }

    case 'list-incidents': {
      const incidents = (config as any).incidents as Array<Record<string, any>> | undefined
      if (!incidents) return { config, visible: true }
      const filtered = incidents.filter((i) =>
        isInScope(scope, { region: i.region, orgId: i.org, stationId: i.stationId })
      )
      return { config: { ...config, incidents: filtered }, visible: filtered.length > 0 }
    }

    case 'list-dispatch': {
      const items = (config as any).items as Array<Record<string, any>> | undefined
      if (!items) return { config, visible: true }
      const filtered = items.filter((i) =>
        isInScope(scope, { region: i.region, orgId: i.orgId, stationId: i.stationId })
      )
      return { config: { ...config, items: filtered }, visible: filtered.length > 0 }
    }

    case 'list-approvals': {
      const items = (config as any).items as Array<Record<string, any>> | undefined
      if (!items) return { config, visible: true }
      // Approvals are scoped by org when provided
      const filtered = items.filter((i) => isInScope(scope, { orgId: i.owner }))
      return { config: { ...config, items: filtered }, visible: filtered.length > 0 }
    }

    case 'list-audit': {
      const events = (config as any).events as Array<Record<string, any>> | undefined
      if (!events) return { config, visible: true }
      // Audit events may not carry rich scope; keep as-is
      return { config, visible: events.length > 0 }
    }

    case 'panel-performance': {
      const regions = (config as any).regions as Array<Record<string, any>> | undefined
      if (!regions) return { config, visible: true }
      const filtered = regions.filter((r) => regionInScope(scope, r.region))
      return { config: { ...config, regions: filtered }, visible: filtered.length > 0 }
    }

    default:
      return { config, visible: true }
  }
}


