import React, { useState } from 'react';

/**
 * Operator Shift Handoff Widget
 */
export function ShiftHandoffWidget({ config }: { config: any }) {
    const [notes, setNotes] = useState(config?.initialNotes || '');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 800);
    };

    return (
        <div className="rounded-xl bg-panel border border-white/5 p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-text">Shift Handoff</h2>
                {lastSaved && <span className="text-[10px] text-muted uppercase font-bold tracking-wider bg-white/5 px-2 py-0.5 rounded">Saved {lastSaved}</span>}
            </div>

            <div className="grid md:grid-cols-2 gap-4 flex-1">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
                    <h3 className="text-xs font-bold text-muted mb-3 uppercase tracking-wider">Current Context</h3>
                    <ul className="text-[13px] space-y-3 flex-1">
                        <li className="flex items-start gap-2.5 text-text/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                            <span>08:00–16:00 • Central Hub region</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-text/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                            <span>Open critical: IN-921 (OCPP timeout)</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-text/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                            <span>Escalation: CP-B4 comms pending</span>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add handoff notes for the next shift..."
                        className="flex-1 w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[13px] text-text placeholder:text-muted focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all resize-none min-h-[120px]"
                    />
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`mt-3 w-full py-2.5 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${isSaving
                                ? 'bg-white/10 text-muted cursor-not-allowed'
                                : 'bg-accent text-white hover:bg-accent-hover shadow-lg active:scale-[0.98]'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                            </>
                        ) : 'Save Handoff Notes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
