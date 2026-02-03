import { useState } from 'react'
import { useServiceLogs } from '@/modules/analytics/hooks/useAnalytics'
import { TextSkeleton } from '@/ui/components/SkeletonCards'
import type { ServiceLog } from '@/core/api/types'

interface ServiceLogsModalProps {
    serviceName: string
    onClose: () => void
}

export function ServiceLogsModal({ serviceName, onClose }: ServiceLogsModalProps) {
    const [lines, setLines] = useState(100)
    const { data: logs, isLoading, error, refetch } = useServiceLogs(serviceName, lines)

    function getLevelColor(level: ServiceLog['level']) {
        switch (level) {
            case 'error':
                return 'text-red-600 bg-red-50'
            case 'warn':
                return 'text-orange-600 bg-orange-50'
            case 'info':
                return 'text-blue-600 bg-blue-50'
            case 'debug':
                return 'text-gray-600 bg-gray-50'
            default:
                return 'text-gray-600 bg-gray-50'
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col m-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-light">
                    <div>
                        <h2 className="text-lg font-semibold text-text">{serviceName} Logs</h2>
                        <p className="text-sm text-muted">Real-time service logs</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="btn secondary text-sm"
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            ↻ Refresh
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-border-light rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-4 border-b border-border-light">
                    <label className="text-sm text-muted">
                        Number of lines:
                        <select
                            value={lines}
                            onChange={(e) => setLines(Number(e.target.value))}
                            className="ml-2 px-3 py-1 border border-border-light rounded-lg text-text"
                        >
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                        </select>
                    </label>
                </div>

                {/* Logs Content */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    {isLoading && (
                        <div className="space-y-2">
                            <TextSkeleton lines={5} />
                        </div>
                    )}

                    {error && (
                        <div className="text-red-600 text-sm">
                            Failed to load logs: {error instanceof Error ? error.message : 'Unknown error'}
                        </div>
                    )}

                    {!isLoading && !error && logs && logs.length === 0 && (
                        <div className="text-muted text-sm text-center py-8">
                            No logs available for this service.
                        </div>
                    )}

                    {!isLoading && !error && logs && logs.length > 0 && (
                        <div className="font-mono text-xs space-y-1">
                            {logs.map((log, idx) => (
                                <div
                                    key={idx}
                                    className="p-2 rounded border border-border-light bg-surface"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-muted whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${getLevelColor(log.level)}`}>
                                            {log.level}
                                        </span>
                                        <span className="flex-1 text-text break-all">
                                            {log.message}
                                        </span>
                                    </div>
                                    {log.context && (
                                        <div className="mt-1 pl-32 text-muted">
                                            Context: {log.context}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-light flex justify-end">
                    <button onClick={onClose} className="btn secondary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
