import React from 'react';

/**
 * Site Owner - My Sites Table Widget
 */
export function SitesTableWidget({ config }: { config: any }) {
    const sites = config?.sites || [];

    const statusColors: Record<string, string> = {
        Active: 'bg-emerald-100 text-emerald-700',
        Approved: 'bg-blue-100 text-blue-700',
        Pending: 'bg-amber-100 text-amber-700',
        Inactive: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text">My Sites</h2>
                <a href="/sites" className="text-xs text-accent hover:underline font-medium">View all</a>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border flex-1">
                <table className="min-w-full text-[13px]">
                    <thead className="bg-muted text-subtle">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-medium">Site</th>
                            <th className="px-4 py-2.5 text-left font-medium">City</th>
                            <th className="px-4 py-2.5 text-left font-medium">Status</th>
                            <th className="px-4 py-2.5 text-left font-medium">Bays</th>
                            <th className="px-4 py-2.5 text-left font-medium">Power</th>
                            <th className="px-4 py-2.5 !text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sites.map((r: any) => (
                            <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-2.5 font-medium text-text">{r.name}</td>
                                <td className="px-4 py-2.5 text-subtle">{r.city}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[r.status] || 'bg-gray-50 text-gray-500'}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-subtle">{r.bays}</td>
                                <td className="px-4 py-2.5 text-subtle">{r.power} kW</td>
                                <td className="px-4 py-2.5 text-right">
                                    <div className="inline-flex items-center gap-1.5 font-semibold">
                                        <button className="px-2 py-0.5 rounded border border-border hover:bg-muted text-[11px] text-text-secondary">Open</button>
                                        <button className="px-2 py-0.5 rounded border border-border hover:bg-muted text-[11px] text-text-secondary">Edit</button>
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

/**
 * Site Owner - Applications Table Widget
 */
export function ApplicationsTableWidget({ config }: { config: any }) {
    const apps = config?.apps || [];

    const statusColors: Record<string, string> = {
        'Under Review': 'bg-amber-100 text-amber-700',
        Applied: 'bg-blue-100 text-blue-700',
        Approved: 'bg-emerald-100 text-emerald-700',
        Rejected: 'bg-rose-100 text-rose-700',
    };

    return (
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text">Applications</h2>
                <a href="/explore" className="text-xs text-accent hover:underline font-medium">Browse sites</a>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border flex-1">
                <table className="min-w-full text-[13px]">
                    <thead className="bg-muted text-subtle">
                        <tr>
                            <th className="px-4 py-2.5 text-left font-medium">App ID</th>
                            <th className="px-4 py-2.5 text-left font-medium">Site</th>
                            <th className="px-4 py-2.5 text-left font-medium">Model</th>
                            <th className="px-4 py-2.5 text-left font-medium">Status</th>
                            <th className="px-4 py-2.5 text-left font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {apps.map((a: any) => (
                            <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-2.5 font-medium text-text">{a.id}</td>
                                <td className="px-4 py-2.5 text-subtle">{a.site}</td>
                                <td className="px-4 py-2.5 text-subtle">{a.model}</td>
                                <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[a.status] || 'bg-gray-50 text-gray-500'}`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-subtle">{a.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
