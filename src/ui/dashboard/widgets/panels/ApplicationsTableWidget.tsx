import React from 'react';

/**
 * Site Owner - Applications Table Widget
 */
export function ApplicationsTableWidget({ config }: { config: any }) {
    const apps = config?.apps || [];

    const statusColors: Record<string, string> = {
        'Under Review': 'bg-amber-100/10 text-amber-500 border-amber-500/20',
        Applied: 'bg-blue-100/10 text-blue-500 border-blue-500/20',
        Approved: 'bg-emerald-100/10 text-emerald-500 border-emerald-500/20',
        Rejected: 'bg-rose-100/10 text-rose-500 border-rose-500/20',
    };

    return (
        <div className="rounded-xl bg-panel border border-white/5 p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text">Applications</h2>
                <a href="/explore" className="text-xs text-accent hover:underline font-medium">Browse sites</a>
            </div>
            <div className="overflow-x-auto rounded-lg border border-white/5 flex-1">
                <table className="min-w-full text-[13px]">
                    <thead className="bg-white/5 text-muted">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-medium">App ID</th>
                            <th className="px-4 py-2.5 text-left font-medium">Site</th>
                            <th className="px-4 py-2.5 text-left font-medium">Model</th>
                            <th className="px-4 py-2.5 text-left font-medium">Status</th>
                            <th className="px-4 py-2.5 text-left font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {apps.map((a: any) => (
                            <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-2.5 font-medium text-text">{a.id}</td>
                                <td className="px-4 py-2.5 text-muted">{a.site}</td>
                                <td className="px-4 py-2.5 text-muted">{a.model}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[a.status] || 'bg-gray-50 text-gray-500'}`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-muted">{a.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
