import React from 'react';

export type QuickAction = {
    label: string;
    path?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary';
};

/**
 * Quick Actions Widget
 */
export function QuickActionsWidget({ config }: { config: any }) {
    const actions: QuickAction[] = config?.actions || [];
    const title = config?.title || 'Quick Actions';

    return (
        <div className="rounded-xl bg-panel border border-white/5 p-5 shadow-sm">
            <h2 className="font-semibold text-text mb-4">{title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {actions.map((action, i) => {
                    const content = (
                        <>
                            {action.icon && <span className="flex-shrink-0 text-accent">{action.icon}</span>}
                            <span className="truncate">{action.label}</span>
                        </>
                    );

                    const className = `flex items-center gap-3 p-4 rounded-xl font-bold text-[13px] transition-all active:scale-[0.98] ${action.variant === 'primary'
                            ? 'bg-accent text-white hover:bg-accent-hover shadow-lg'
                            : 'bg-white/5 border border-white/10 text-text hover:bg-white/10'
                        }`;

                    if (action.path) {
                        return (
                            <a key={i} href={action.path} className={className}>
                                {content}
                            </a>
                        );
                    }

                    return (
                        <button key={i} onClick={action.onClick} className={className}>
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
