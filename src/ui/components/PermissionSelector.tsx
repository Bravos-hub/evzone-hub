import { PERMISSIONS, hasPermission } from '@/constants/permissions'
import { useState } from 'react'
import { useAuthStore } from '@/core/auth/authStore'
import type { Role } from '@/core/auth/types'

type PermissionSelectorProps = {
    selectedPermissions: string[]
    onChange: (permissions: string[]) => void
}

export function PermissionSelector({ selectedPermissions, onChange }: PermissionSelectorProps) {
    const [expandedFeature, setExpandedFeature] = useState<string | null>(null)
    const { user } = useAuthStore()

    const togglePermission = (feature: string, action: string) => {
        const permString = `${feature}.${action}`
        if (selectedPermissions.includes(permString)) {
            onChange(selectedPermissions.filter((p) => p !== permString))
        } else {
            onChange([...selectedPermissions, permString])
        }
    }

    const toggleAllInFeature = (feature: string, actions: string[]) => {
        const allSelected = actions.every(action => selectedPermissions.includes(`${feature}.${action}`))

        if (allSelected) {
            // Deselect all
            onChange(selectedPermissions.filter(p => !p.startsWith(`${feature}.`)))
        } else {
            // Select all
            const newPerms = [...selectedPermissions]
            actions.forEach(action => {
                const permString = `${feature}.${action}`
                if (!newPerms.includes(permString)) {
                    newPerms.push(permString)
                }
            })
            onChange(newPerms)
        }
    }

    // Sort features alphabetically for better UX
    const features = Object.entries(PERMISSIONS).sort((a, b) => a[0].localeCompare(b[0]))

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 border border-white/10 rounded-lg p-4 bg-white/5">
            {features.map(([feature, config]) => {
                // Filter actions based on what the CURRENT USER has access to
                // Users cannot grant permissions they do not have themselves
                const actions = Object.keys(config).filter(action => {
                    if (action === 'description') return false
                    return hasPermission(user?.role, feature as any, action)
                })

                // If user has no permissions in this feature, don't show it at all
                if (actions.length === 0) return null

                const allSelected = actions.every(action => selectedPermissions.includes(`${feature}.${action}`))
                const someSelected = actions.some(action => selectedPermissions.includes(`${feature}.${action}`))
                const isExpanded = expandedFeature === feature

                return (
                    <div key={feature} className="border-b border-white/10 last:border-0 pb-2 mb-2">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    className="rounded border-white/20 bg-white/5 text-brand-orange focus:ring-brand-orange"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) input.indeterminate = someSelected && !allSelected
                                    }}
                                    onChange={() => toggleAllInFeature(feature, actions)}
                                />
                                <button
                                    onClick={() => setExpandedFeature(isExpanded ? null : feature)}
                                    className="text-sm font-medium text-text capitalize flex items-center gap-2 hover:text-white"
                                >
                                    {feature.replace(/([A-Z])/g, ' $1').trim()}
                                </button>
                            </div>
                            <button
                                onClick={() => setExpandedFeature(isExpanded ? null : feature)}
                                className="text-muted hover:text-white p-1"
                            >
                                {isExpanded ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="18 15 12 9 6 15" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {isExpanded && (
                            <div className="pl-8 grid grid-cols-2 gap-2">
                                {actions.map(action => (
                                    <label key={action} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="rounded border-white/20 bg-white/5 text-brand-orange focus:ring-brand-orange"
                                            checked={selectedPermissions.includes(`${feature}.${action}`)}
                                            onChange={() => togglePermission(feature, action)}
                                        />
                                        <span className="text-xs text-muted group-hover:text-text capitalize">
                                            {action.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
