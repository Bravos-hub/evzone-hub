import React from 'react';

/**
 * Site Owner - My Sites Table Widget
 */
export function SitesTableWidget({ config }: { config: any }) {
    const sites = config?.sites || [];

    const statusColors: Record<string, string> = {
        Active: 'bg-emerald-100/10 text-emerald-500 border-emerald-500/20',
        Approved: 'bg-blue-100/10 text-blue-500 border-blue-500/20',
        Pending: 'bg-amber-100/10 text-amber-500 border-amber-500/20',
        Inactive: 'bg-gray-100/10 text-gray-400 border-gray-400/20',
    };

    return (
        <div className="rounded-xl bg-panel border border-white/5 p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text">My Sites</h2>
                <a href="/sites" className="text-xs text-accent hover:underline font-medium">View all</a>
            </div>
            <div className="overflow-x-auto rounded-lg border border-white/5 flex-1">
                <table className="min-w-full text-[13px]">
                    <thead className="bg-white/5 text-muted">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-medium">Site</th>
                            <th className="px-4 py-2.5 text-left font-medium">City</th>
                            <th className="px-4 py-2.5 text-left font-medium">Status</th>
                            <th className="px-4 py-2.5 text-left font-medium">Bays</th>
                            <th className="px-4 py-2.5 text-left font-medium">Power</th>
                            <th className="px-4 py-2.5 !text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sites.map((r: any) => (
                            <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-2.5 font-medium text-text">{r.name}</td>
                                <td className="px-4 py-2.5 text-muted">{r.city}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[r.status] || 'bg-gray-50 text-gray-500'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-muted">{r.bays}</td>
                                <td className="px-4 py-2.5 text-muted">{r.power} kW</td>
                                <td className="px-4 py-2.5 text-right">
                                    <div className="inline-flex items-center gap-1.5 font-bold">
                                        <button className="px-2 py-0.5 rounded border border-white/10 hover:bg-white/5 text-[11px] text-muted hover:text-text transition-colors">Open</button>
                                        <button className="px-2 py-0.5 rounded border border-white/10 hover:bg-white/5 text-[11px] text-muted hover:text-text transition-colors">Edit</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
