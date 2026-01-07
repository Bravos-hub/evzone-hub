import { useAuthStore } from '@/core/auth/authStore'
import type { Scope } from '@/core/auth/types'
import { WIDGET_REGISTRY } from './widgetRegistry'
import { adaptWidgetConfig } from './scopeAdapters'
import type { WidgetId, WidgetSize } from './types'

type WidgetProps = {
  widgetId: WidgetId
  config?: Record<string, unknown>
  size?: WidgetSize
  className?: string
  scope: Scope
}

/** Convert widget size to Tailwind grid class */
function sizeToClass(size: WidgetSize): string {
  switch (size) {
    case '1':
      return 'col-span-1'
    case '2':
      return 'col-span-2'
    case '3':
      return 'col-span-3'
    case '4':
      return 'col-span-4'
    case 'full':
      return 'col-span-full'
    default:
      return 'col-span-1'
  }
}

/**
 * RBAC-aware Widget Renderer
 * 
 * Renders a widget from the registry only if the current user's role is allowed.
 * Renders nothing (null) if:
 * - User is not logged in
 * - Widget doesn't exist in registry
 * - User's role is not in the widget's allowedRoles
 */
export function Widget({ widgetId, config, size, className, scope }: WidgetProps) {
  const { user } = useAuthStore()

  // Get widget definition from registry
  const def = WIDGET_REGISTRY[widgetId]

  // Silent fail if widget doesn't exist
  if (!def) {
    if (import.meta.env.DEV) {
      console.warn(`[Widget] Unknown widget ID: ${widgetId}`)
    }
    return null
  }

  // RBAC check - render nothing if user's role isn't allowed
  if (!user) {
    return null
  }

  // Check role permission (empty allowedRoles means all roles)
  if (user.role !== 'SUPER_ADMIN' && def.allowedRoles.length > 0 && !def.allowedRoles.includes(user.role)) {
    return null
  }

  // Check owner capability if specified
  if (def.ownerCapabilities && def.ownerCapabilities.length > 0) {
    if (user.role === 'OWNER' && user.ownerCapability) {
      if (!def.ownerCapabilities.includes(user.ownerCapability)) {
        return null
      }
    }
  }

  const Component = def.component
  const finalSize = size ?? def.defaultSize
  const gridClass = sizeToClass(finalSize)

  // Apply scope adaptation (filter data / hide when out-of-scope)
  const { config: scopedConfig, visible } = adaptWidgetConfig(widgetId, config, scope)
  if (!visible) return null

  return (
    <div className={`${gridClass} ${className ?? ''}`}>
      <Component config={scopedConfig} />
    </div>
  )
}

/**
 * Render multiple widgets in a row
 * Filters out any widgets the user doesn't have access to
 */
export function WidgetRow({
  widgets,
  className,
  scope,
}: {
  widgets: Array<{ id: WidgetId; size?: WidgetSize; config?: Record<string, unknown> }>
  className?: string
  scope: Scope
}) {
  return (
    <div className={`grid grid-cols-4 gap-4 ${className ?? ''}`}>
      {widgets.map((w, i) => (
        <Widget key={`${w.id}-${i}`} widgetId={w.id} size={w.size} config={w.config} scope={scope} />
      ))}
    </div>
  )
}

