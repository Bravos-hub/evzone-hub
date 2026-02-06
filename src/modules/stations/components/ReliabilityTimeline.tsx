import { useMemo } from 'react';
import { format, subHours, isAfter } from 'date-fns';

interface StatusHistoryEntry {
    timestamp: string;
    status: string;
}

interface ReliabilityTimelineProps {
    history: StatusHistoryEntry[];
    hours?: number;
}

export function ReliabilityTimeline({ history, hours = 24 }: ReliabilityTimelineProps) {
    const slots = useMemo(() => {
        const now = new Date();
        const startTime = subHours(now, hours);
        const slotCount = 48; // 30-minute slots for 24h
        const intervalMs = (hours * 60 * 60 * 1000) / slotCount;

        const timeline = Array.from({ length: slotCount }).map((_, i) => {
            const slotStart = new Date(startTime.getTime() + i * intervalMs);
            const slotEnd = new Date(slotStart.getTime() + intervalMs);

            // Find if there was any 'Online' event in this window, or if it was online before and didn't go offline
            // For simplicity, we'll check if any status in history falls within this window
            const statusInWindow = history.filter(h => {
                const hTime = new Date(h.timestamp);
                return hTime >= slotStart && hTime < slotEnd;
            });

            // If we have history, use the last known status. 
            // If no history in window, check previous history
            let isOnline = false;
            if (statusInWindow.length > 0) {
                isOnline = statusInWindow[statusInWindow.length - 1].status === 'Online';
            } else {
                const previousHistory = history.filter(h => new Date(h.timestamp) < slotStart);
                if (previousHistory.length > 0) {
                    isOnline = previousHistory[previousHistory.length - 1].status === 'Online';
                }
            }

            return {
                time: slotStart,
                isOnline
            };
        });

        return timeline;
    }, [history, hours]);

    const uptime = useMemo(() => {
        if (slots.length === 0) return 100;
        const onlineSlots = slots.filter(s => s.isOnline).length;
        return Math.round((onlineSlots / slots.length) * 100);
    }, [slots]);

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-muted uppercase tracking-tighter">
                    24H RELIABILITY PULSE
                </span>
                <span className={`text-[10px] font-black ${uptime > 95 ? 'text-ok' : 'text-warn'}`}>
                    {uptime}% UPTIME
                </span>
            </div>

            <div className="flex gap-[2px] h-4 items-center">
                {slots.map((slot, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-full rounded-[1px] transition-all duration-500 ${slot.isOnline
                                ? 'bg-ok opacity-80 hover:opacity-100 hover:scale-y-125'
                                : 'bg-danger opacity-30 hover:opacity-60 scale-y-75'
                            }`}
                        title={`${format(slot.time, 'HH:mm')} - ${slot.isOnline ? 'Operational' : 'Down'}`}
                    />
                ))}
            </div>

            <div className="flex justify-between text-[8px] text-muted-more font-bold uppercase tracking-widest">
                <span>{hours}h ago</span>
                <span>Now</span>
            </div>
        </div>
    );
}
