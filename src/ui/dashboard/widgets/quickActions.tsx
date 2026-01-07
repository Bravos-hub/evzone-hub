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
 * Displays a grid of call-to-action buttons.
 */
export function QuickActionsWidget({ config }: { config: any }) {
    const actions: QuickAction[] = config?.actions || [];
    const title = config?.title || 'Quick Actions';

    return (
        <div className="rounded-xl bg-surface border border-border p-5 shadow-sm">
            <h2 className="font-semibold text-text mb-4">{title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {actions.map((action, i) => {
                    const content = (
                        <>
                            {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                            <span className="truncate">{action.label}</span>
                        </>
                    );

                    const className = `flex items-center gap-2.5 p-3.5 rounded-xl font-bold text-[13px] transition-all active:scale-[0.98] ${action.variant === 'primary'
                            ? 'bg-accent text-white hover:bg-accent-hover shadow-sm'
                            : 'bg-muted/40 border border-border text-text hover:bg-muted/60'
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
